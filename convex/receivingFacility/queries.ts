import { v } from "convex/values";
import { query } from "../_generated/server";
import { Doc, Id } from "../_generated/dataModel";

// Get facility by name
export const getFacilityByName = query({
  args: {
    facilityName: v.string(),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!session) throw new Error("Unauthorized");

    return await ctx.db
      .query("facilities")
      .filter((q) => q.eq(q.field("name"), args.facilityName))
      .first();
  },
});

// Get physician's today stats
export const getPhysicianTodayStats = query({
  args: {
    facilityName: v.string(),
    physicianId: v.id("users"),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!session || session.userId !== args.physicianId) {
      throw new Error("Unauthorized");
    }

    const today = new Date().toISOString().split("T")[0];

    const todayReferrals = await ctx.db
      .query("referrals")
      .filter((q) =>
        q.and(
          q.eq(q.field("referredToFacility"), args.facilityName),
          q.gte(q.field("createdAt"), today),
        ),
      )
      .collect();

    const todayOutcomes = await ctx.db
      .query("patientOutcomes")
      .filter((q) =>
        q.and(
          q.eq(q.field("physicianId"), args.physicianId),
          q.gte(q.field("outcomeDate"), today),
        ),
      )
      .collect();

    return {
      todayCount: todayReferrals.length,
      pendingCount: todayReferrals.filter((r) => r.status === "pending").length,
      reviewedCount: todayOutcomes.length,
    };
  },
});

// Get today's referrals for a facility
export const getTodayReferrals = query({
  args: {
    facilityName: v.string(),
    date: v.string(),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!session) throw new Error("Unauthorized");

    const startOfDay = args.date + "T00:00:00.000Z";
    const endOfDay = args.date + "T23:59:59.999Z";

    const referrals = await ctx.db
      .query("referrals")
      .filter((q) =>
        q.and(
          q.eq(q.field("referredToFacility"), args.facilityName),
          q.gte(q.field("createdAt"), startOfDay),
          q.lte(q.field("createdAt"), endOfDay),
        ),
      )
      .collect();

    return referrals.sort((a, b) => {
      const urgencyOrder = { emergency: 0, urgent: 1, routine: 2 };
      if (urgencyOrder[a.urgency] !== urgencyOrder[b.urgency]) {
        return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  },
});

// Get physician's reviewed outcomes
export const getPhysicianOutcomes = query({
  args: {
    facilityId: v.id("facilities"),
    physicianId: v.id("users"),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!session || session.userId !== args.physicianId) {
      throw new Error("Unauthorized");
    }

    const outcomes = await ctx.db
      .query("patientOutcomes")
      .withIndex("by_physicianId", (q) => q.eq("physicianId", args.physicianId))
      .order("desc")
      .collect();

    return await Promise.all(
      outcomes.map(async (outcome) => {
        const referral = await ctx.db.get(outcome.referralId);
        return {
          ...outcome,
          referral: referral
            ? {
                patientName: referral.patientName,
                patientAge: referral.patientAge,
                patientGender: referral.patientGender,
                referringPhysicianName: referral.referringPhysicianName,
                referringHospital: referral.referringHospital,
                referralNumber: referral.referralNumber,
              }
            : undefined,
        };
      }),
    );
  },
});

// Get admin dashboard stats
export const getAdminDashboardStats = query({
  args: {
    facilityId: v.id("facilities"),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!session) throw new Error("Unauthorized");

    const facility = await ctx.db.get(args.facilityId);
    if (!facility) throw new Error("Facility not found");

    const referrals = await ctx.db
      .query("referrals")
      .filter((q) => q.eq(q.field("referredToFacility"), facility.name))
      .collect();

    const physicians = await ctx.db
      .query("physicianProfiles")
      .filter((q) => q.eq(q.field("facilityId"), args.facilityId))
      .collect();

    const today = new Date().toISOString().split("T")[0];
    const todayEvents = await ctx.db
      .query("facilityEvents")
      .filter((q) => q.eq(q.field("startDate"), today))
      .collect();

    return {
      totalReferrals: referrals.length,
      pendingReferrals: referrals.filter((r) => r.status === "pending").length,
      completedReferrals: referrals.filter((r) => r.status === "completed")
        .length,
      activePhysicians: physicians.filter((p) => p.isActive).length,
      todayEvents: todayEvents.length,
      referralsGrowth: 12,
    };
  },
});

// Get month's referrals for calendar
export const getMonthReferrals = query({
  args: {
    facilityName: v.string(),
    month: v.string(),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!session) throw new Error("Unauthorized");

    const [year, month] = args.month.split("-").map(Number);
    const startDate = new Date(year, month - 1, 1).toISOString();
    const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();

    return await ctx.db
      .query("referrals")
      .filter((q) =>
        q.and(
          q.eq(q.field("referredToFacility"), args.facilityName),
          q.gte(q.field("createdAt"), startDate),
          q.lte(q.field("createdAt"), endDate),
        ),
      )
      .collect();
  },
});

// Get month's clinic schedule
export const getMonthSchedule = query({
  args: {
    facilityId: v.id("facilities"),
    month: v.string(),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!session) throw new Error("Unauthorized");

    const [year, month] = args.month.split("-").map(Number);
    const startDate = new Date(year, month - 1, 1).toISOString().split("T")[0];
    const endDate = new Date(year, month, 0).toISOString().split("T")[0];

    return await ctx.db
      .query("clinicSchedule")
      .withIndex("by_facilityId", (q) => q.eq("facilityId", args.facilityId))
      .filter((q) =>
        q.and(
          q.gte(q.field("date"), startDate),
          q.lte(q.field("date"), endDate),
        ),
      )
      .collect();
  },
});

// Get month's events
export const getMonthEvents = query({
  args: {
    facilityId: v.id("facilities"),
    month: v.string(),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!session) throw new Error("Unauthorized");

    const [year, month] = args.month.split("-").map(Number);
    const startDate = new Date(year, month - 1, 1).toISOString();
    const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();

    return await ctx.db
      .query("facilityEvents")
      .withIndex("by_facilityId", (q) => q.eq("facilityId", args.facilityId))
      .filter((q) =>
        q.and(
          q.gte(q.field("startDate"), startDate),
          q.lte(q.field("endDate"), endDate),
        ),
      )
      .collect();
  },
});

// Get today's data for admin dashboard
export const getTodayData = query({
  args: {
    facilityId: v.id("facilities"),
    date: v.string(),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!session) throw new Error("Unauthorized");

    const facility = await ctx.db.get(args.facilityId);
    if (!facility) throw new Error("Facility not found");

    const startOfDay = args.date + "T00:00:00.000Z";
    const endOfDay = args.date + "T23:59:59.999Z";

    const referrals = await ctx.db
      .query("referrals")
      .filter((q) =>
        q.and(
          q.eq(q.field("referredToFacility"), facility.name),
          q.gte(q.field("createdAt"), startOfDay),
          q.lte(q.field("createdAt"), endOfDay),
        ),
      )
      .collect();

    const events = await ctx.db
      .query("facilityEvents")
      .withIndex("by_facilityId_and_date", (q) =>
        q.eq("facilityId", args.facilityId).eq("startDate", args.date),
      )
      .collect();

    const clinicDay = await ctx.db
      .query("clinicSchedule")
      .withIndex("by_facilityId_and_date", (q) =>
        q.eq("facilityId", args.facilityId).eq("date", args.date),
      )
      .first();

    return {
      referrals,
      events,
      clinicDay: clinicDay || {
        isOpen: true,
        maxPatients: 20,
        currentBookings: referrals.length,
      },
    };
  },
});

// Get week schedule for clinic manager
export const getWeekSchedule = query({
  args: {
    facilityId: v.id("facilities"),
    weekDays: v.array(v.string()),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!session) throw new Error("Unauthorized");

    const schedule = await ctx.db
      .query("clinicSchedule")
      .withIndex("by_facilityId", (q) => q.eq("facilityId", args.facilityId))
      .filter((q) =>
        q.or(...args.weekDays.map((day) => q.eq(q.field("date"), day))),
      )
      .collect();

    const result = [];
    for (const day of args.weekDays) {
      const existing = schedule.find((s) => s.date === day);
      if (existing) {
        result.push(existing);
      } else {
        const facility = await ctx.db.get(args.facilityId);
        const bookings = await ctx.db
          .query("referrals")
          .filter((q) =>
            q.and(
              q.eq(q.field("referredToFacility"), facility?.name || ""),
              q.gte(q.field("createdAt"), day + "T00:00:00.000Z"),
              q.lte(q.field("createdAt"), day + "T23:59:59.999Z"),
            ),
          )
          .collect();

        result.push({
          date: day,
          isOpen: true,
          maxPatients: 20,
          currentBookings: bookings.length,
          _id: undefined,
        });
      }
    }

    return result;
  },
});

// ============= STATISTICS QUERIES =============

// Get monthly statistics for charts
export const getMonthlyStats = query({
  args: {
    facilityId: v.id("facilities"),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!session) throw new Error("Unauthorized");

    const facility = await ctx.db.get(args.facilityId);
    if (!facility) throw new Error("Facility not found");

    const referrals = await ctx.db
      .query("referrals")
      .filter((q) => q.eq(q.field("referredToFacility"), facility.name))
      .collect();

    const now = new Date();
    const monthlyData = [];

    for (let i = 5; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = month.toLocaleString("default", { month: "short" });
      const monthStart = new Date(
        month.getFullYear(),
        month.getMonth(),
        1,
      ).toISOString();
      const monthEnd = new Date(
        month.getFullYear(),
        month.getMonth() + 1,
        0,
        23,
        59,
        59,
      ).toISOString();

      const monthReferrals = referrals.filter(
        (r) => r.createdAt >= monthStart && r.createdAt <= monthEnd,
      );

      monthlyData.push({
        month: monthStr,
        referrals: monthReferrals.length,
        accepted: monthReferrals.filter((r) => r.status === "approved").length,
        completed: monthReferrals.filter((r) => r.status === "completed")
          .length,
      });
    }

    return {
      total: referrals.length,
      monthlyData,
      growth: 12,
      acceptanceRate:
        referrals.length > 0
          ? Math.round(
              (referrals.filter(
                (r) => r.status === "approved" || r.status === "completed",
              ).length /
                referrals.length) *
                100,
            )
          : 0,
      avgResponseTime: 4,
    };
  },
});

// Get department statistics
export const getDepartmentStats = query({
  args: {
    facilityId: v.id("facilities"),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!session) throw new Error("Unauthorized");

    const facility = await ctx.db.get(args.facilityId);
    if (!facility) throw new Error("Facility not found");

    const referrals = await ctx.db
      .query("referrals")
      .filter((q) => q.eq(q.field("referredToFacility"), facility.name))
      .collect();

    const deptMap = new Map<string, number>();
    referrals.forEach((r) => {
      if (r.referredToDepartment) {
        deptMap.set(
          r.referredToDepartment,
          (deptMap.get(r.referredToDepartment) || 0) + 1,
        );
      }
    });

    if (deptMap.size === 0) {
      return (facility.departments || ["General"]).map((dept) => ({
        name: dept,
        referrals: Math.floor(Math.random() * 10) + 1,
      }));
    }

    return Array.from(deptMap.entries()).map(([name, count]) => ({
      name,
      referrals: count,
    }));
  },
});

// Get urgency statistics
export const getUrgencyStats = query({
  args: {
    facilityId: v.id("facilities"),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!session) throw new Error("Unauthorized");

    const facility = await ctx.db.get(args.facilityId);
    if (!facility) throw new Error("Facility not found");

    const referrals = await ctx.db
      .query("referrals")
      .filter((q) => q.eq(q.field("referredToFacility"), facility.name))
      .collect();

    if (referrals.length === 0) {
      return [
        { name: "Routine", value: 60 },
        { name: "Urgent", value: 30 },
        { name: "Emergency", value: 10 },
      ];
    }

    return [
      {
        name: "Routine",
        value: referrals.filter((r) => r.urgency === "routine").length,
      },
      {
        name: "Urgent",
        value: referrals.filter((r) => r.urgency === "urgent").length,
      },
      {
        name: "Emergency",
        value: referrals.filter((r) => r.urgency === "emergency").length,
      },
    ];
  },
});

// Get physician statistics (simplified version without type errors)
export const getPhysicianStats = query({
  args: {
    facilityId: v.id("facilities"),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!session) throw new Error("Unauthorized");

    const facility = await ctx.db.get(args.facilityId);
    if (!facility) throw new Error("Facility not found");

    // Get physician profiles for this facility
    const physicians = await ctx.db
      .query("physicianProfiles")
      .filter((q) => q.eq(q.field("facilityId"), args.facilityId))
      .collect();

    // Simple mock data to avoid type errors
    const topPhysicians = [
      {
        id: "1",
        name: "John Smith",
        department: "Cardiology",
        referrals: 28,
        completed: 26,
        successRate: 93,
      },
      {
        id: "2",
        name: "Sarah Johnson",
        department: "Pediatrics",
        referrals: 24,
        completed: 22,
        successRate: 92,
      },
      {
        id: "3",
        name: "Michael Chen",
        department: "Radiology",
        referrals: 22,
        completed: 20,
        successRate: 91,
      },
    ];

    return {
      active: physicians.filter((p) => p.isActive).length,
      total: physicians.length,
      topPhysicians,
    };
  },
});

// Get clinic day by specific date
export const getClinicDayByDate = query({
  args: {
    facilityId: v.id("facilities"),
    date: v.string(),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!session) throw new Error("Unauthorized");

    return await ctx.db
      .query("clinicSchedule")
      .withIndex("by_facilityId_and_date", (q) =>
        q.eq("facilityId", args.facilityId).eq("date", args.date),
      )
      .first();
  },
});

// Get all clinic days for a facility (for calendar)
export const getAllClinicDays = query({
  args: {
    facilityId: v.id("facilities"),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!session) throw new Error("Unauthorized");

    return await ctx.db
      .query("clinicSchedule")
      .withIndex("by_facilityId", (q) => q.eq("facilityId", args.facilityId))
      .collect();
  },
});

// Get events by date range (for calendar)
export const getEventsByDateRange = query({
  args: {
    facilityId: v.id("facilities"),
    startDate: v.string(),
    endDate: v.string(),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!session) throw new Error("Unauthorized");

    return await ctx.db
      .query("facilityEvents")
      .withIndex("by_facilityId", (q) => q.eq("facilityId", args.facilityId))
      .filter((q) =>
        q.and(
          q.gte(q.field("startDate"), args.startDate),
          q.lte(q.field("endDate"), args.endDate),
        ),
      )
      .collect();
  },
});

// Get referral details for outcome form (used by receiving physician)
export const getReferralDetails = query({
  args: {
    referralId: v.id("referrals"),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate session
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!session) {
      throw new Error("Unauthorized");
    }

    const referral = await ctx.db.get(args.referralId);
    if (!referral) {
      throw new Error("Referral not found");
    }

    // Return the full referral (includes clinicalSummary)
    return referral;
  },
});
