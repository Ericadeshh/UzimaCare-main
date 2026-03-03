import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { Id } from "../_generated/dataModel";

// Submit patient outcome after reviewing a referral
export const submitPatientOutcome = mutation({
  args: {
    referralId: v.id("referrals"),
    facilityId: v.id("facilities"),
    physicianId: v.id("users"),
    finalDiagnosis: v.string(),
    treatmentGiven: v.optional(v.string()),
    requiresFurtherReferral: v.boolean(),
    furtherReferralFacility: v.optional(v.string()),
    furtherReferralReason: v.optional(v.string()),
    notes: v.optional(v.string()),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify session
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!session) {
      throw new Error("Unauthorized");
    }

    const now = new Date().toISOString();

    // Create the outcome record
    const outcomeId = await ctx.db.insert("patientOutcomes", {
      referralId: args.referralId,
      facilityId: args.facilityId,
      physicianId: args.physicianId,
      finalDiagnosis: args.finalDiagnosis,
      treatmentGiven: args.treatmentGiven,
      requiresFurtherReferral: args.requiresFurtherReferral,
      furtherReferralFacility: args.furtherReferralFacility,
      furtherReferralReason: args.furtherReferralReason,
      furtherReferralCreated: false,
      notes: args.notes,
      outcomeDate: now,
      createdAt: now,
      updatedAt: now,
    });

    // Update the referral status to completed
    await ctx.db.patch(args.referralId, {
      status: "completed",
      completedAt: now,
      updatedAt: now,
    });

    // If further referral is required, create a new referral draft
    let newReferralId = undefined;
    if (args.requiresFurtherReferral && args.furtherReferralFacility) {
      // Get the original referral for patient data
      const originalReferral = await ctx.db.get(args.referralId);

      if (originalReferral) {
        // Create a new referral in pending status (to be completed by sending physician)
        newReferralId = await ctx.db.insert("referrals", {
          patientName: originalReferral.patientName,
          patientAge: originalReferral.patientAge,
          patientGender: originalReferral.patientGender,
          patientContact: originalReferral.patientContact,
          referringPhysicianId: args.physicianId, // Current physician becomes referrer
          referringPhysicianName:
            (await ctx.db.get(args.physicianId))?.name || "Unknown",
          referringHospital: args.furtherReferralFacility,
          diagnosis: args.finalDiagnosis,
          clinicalSummary: `Further referral required: ${args.furtherReferralReason}`,
          reasonForReferral:
            args.furtherReferralReason || "Further specialized care required",
          urgency: "routine",
          referredToFacility: args.furtherReferralFacility,
          referredToDepartment: undefined,
          referredToPhysician: undefined,
          status: "pending",
          createdAt: now,
          updatedAt: now,
          submittedAt: now,
          physicianNotes: `Continuation from referral ${originalReferral.referralNumber}. Original diagnosis: ${originalReferral.diagnosis}`,
          referralNumber: `REF-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        });

        // Update outcome with new referral ID
        await ctx.db.patch(outcomeId, {
          furtherReferralCreated: true,
          newReferralId,
        });
      }
    }

    return {
      success: true,
      outcomeId,
      newReferralId,
    };
  },
});

// Update clinic day schedule
export const updateClinicDay = mutation({
  args: {
    facilityId: v.id("facilities"),
    date: v.string(),
    isOpen: v.boolean(),
    maxPatients: v.number(),
    token: v.string(),
    scheduleId: v.optional(v.id("clinicSchedule")),
  },
  handler: async (ctx, args) => {
    // Verify session
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!session) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.db.get(session.userId);
    if (!user || (user.role !== "admin" && user.role !== "physician")) {
      throw new Error("Unauthorized");
    }

    const now = new Date().toISOString();

    if (args.scheduleId) {
      // Update existing schedule
      await ctx.db.patch(args.scheduleId, {
        isOpen: args.isOpen,
        maxPatients: args.maxPatients,
        updatedBy: session.userId,
        updatedAt: now,
      });
    } else {
      // Create new schedule
      await ctx.db.insert("clinicSchedule", {
        facilityId: args.facilityId,
        date: args.date,
        isOpen: args.isOpen,
        maxPatients: args.maxPatients,
        currentBookings: 0,
        createdBy: session.userId,
        updatedBy: session.userId,
        createdAt: now,
        updatedAt: now,
      });
    }

    return { success: true };
  },
});

// Create facility event (admin only)
export const createFacilityEvent = mutation({
  args: {
    facilityId: v.id("facilities"),
    title: v.string(),
    description: v.optional(v.string()),
    eventType: v.union(
      v.literal("meeting"),
      v.literal("holiday"),
      v.literal("training"),
      v.literal("maintenance"),
      v.literal("other"),
    ),
    startDate: v.string(),
    endDate: v.string(),
    isAllDay: v.boolean(),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify session
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!session) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.db.get(session.userId);
    if (!user || user.role !== "admin") {
      throw new Error("Admin access required");
    }

    const now = new Date().toISOString();

    const eventId = await ctx.db.insert("facilityEvents", {
      facilityId: args.facilityId,
      title: args.title,
      description: args.description,
      eventType: args.eventType,
      startDate: args.startDate,
      endDate: args.endDate,
      isAllDay: args.isAllDay,
      createdBy: session.userId,
      createdAt: now,
      updatedAt: now,
    });

    return { success: true, eventId };
  },
});

// Delete facility event (admin only)
export const deleteFacilityEvent = mutation({
  args: {
    eventId: v.id("facilityEvents"),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify session
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!session) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.db.get(session.userId);
    if (!user || user.role !== "admin") {
      throw new Error("Admin access required");
    }

    await ctx.db.delete(args.eventId);

    return { success: true };
  },
});

// Create or update clinic day for any date
export const createOrUpdateClinicDay = mutation({
  args: {
    facilityId: v.id("facilities"),
    date: v.string(), // YYYY-MM-DD format
    isOpen: v.boolean(),
    maxPatients: v.number(),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify session
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!session) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.db.get(session.userId);
    if (!user || (user.role !== "admin" && user.role !== "physician")) {
      throw new Error("Unauthorized");
    }

    const now = new Date().toISOString();

    // Check if clinic day already exists
    const existing = await ctx.db
      .query("clinicSchedule")
      .withIndex("by_facilityId_and_date", (q) =>
        q.eq("facilityId", args.facilityId).eq("date", args.date),
      )
      .first();

    if (existing) {
      // Update existing
      await ctx.db.patch(existing._id, {
        isOpen: args.isOpen,
        maxPatients: args.maxPatients,
        updatedBy: session.userId,
        updatedAt: now,
      });
      return { success: true, message: "Clinic day updated", id: existing._id };
    } else {
      // Create new
      const id = await ctx.db.insert("clinicSchedule", {
        facilityId: args.facilityId,
        date: args.date,
        isOpen: args.isOpen,
        maxPatients: args.maxPatients,
        currentBookings: 0,
        createdBy: session.userId,
        updatedBy: session.userId,
        createdAt: now,
        updatedAt: now,
      });
      return { success: true, message: "Clinic day created", id };
    }
  },
});

// Delete clinic day
export const deleteClinicDay = mutation({
  args: {
    clinicDayId: v.id("clinicSchedule"),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify session
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!session) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.db.get(session.userId);
    if (!user || user.role !== "admin") {
      throw new Error("Admin access required");
    }

    await ctx.db.delete(args.clinicDayId);
    return { success: true, message: "Clinic day deleted" };
  },
});

// Create facility event
export const createEvent = mutation({
  args: {
    facilityId: v.id("facilities"),
    title: v.string(),
    description: v.optional(v.string()),
    eventType: v.union(
      v.literal("meeting"),
      v.literal("holiday"),
      v.literal("training"),
      v.literal("maintenance"),
      v.literal("other"),
    ),
    startDate: v.string(), // ISO date
    endDate: v.string(), // ISO date
    isAllDay: v.boolean(),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify session
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!session) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.db.get(session.userId);
    if (!user || user.role !== "admin") {
      throw new Error("Admin access required");
    }

    const now = new Date().toISOString();

    const id = await ctx.db.insert("facilityEvents", {
      facilityId: args.facilityId,
      title: args.title,
      description: args.description,
      eventType: args.eventType,
      startDate: args.startDate,
      endDate: args.endDate,
      isAllDay: args.isAllDay,
      createdBy: session.userId,
      createdAt: now,
      updatedAt: now,
    });

    return { success: true, message: "Event created", id };
  },
});

// Update event
export const updateEvent = mutation({
  args: {
    eventId: v.id("facilityEvents"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    eventType: v.optional(
      v.union(
        v.literal("meeting"),
        v.literal("holiday"),
        v.literal("training"),
        v.literal("maintenance"),
        v.literal("other"),
      ),
    ),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    isAllDay: v.optional(v.boolean()),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify session
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!session) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.db.get(session.userId);
    if (!user || user.role !== "admin") {
      throw new Error("Admin access required");
    }

    const { eventId, token, ...updates } = args;

    await ctx.db.patch(eventId, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });

    return { success: true, message: "Event updated" };
  },
});

// Delete event
export const deleteEvent = mutation({
  args: {
    eventId: v.id("facilityEvents"),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify session
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!session) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.db.get(session.userId);
    if (!user || user.role !== "admin") {
      throw new Error("Admin access required");
    }

    await ctx.db.delete(args.eventId);
    return { success: true, message: "Event deleted" };
  },
});
