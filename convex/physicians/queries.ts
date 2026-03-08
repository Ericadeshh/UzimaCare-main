import { v } from "convex/values";
import { query } from "../_generated/server";
import { Doc, Id } from "../_generated/dataModel";

// Define the return type interface
interface PhysicianDashboardStats {
  totalReferrals: number;
  pendingReferrals: number;
  completedReferrals: number;
  approvedReferrals: number;
  aiSummaryCount: number;
  recentActivity: Array<{
    type: string;
    title: string;
    patientName: string;
    time: string;
    status: string;
    statusColor: string;
    color: string;
  }>;
}

// Get physician dashboard stats - FIXED with explicit return type
export const getPhysicianDashboardStats = query({
  args: {
    token: v.string(),
    physicianId: v.id("users"),
  },
  handler: async (ctx, args): Promise<PhysicianDashboardStats> => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!session || session.userId !== args.physicianId) {
      throw new Error("Unauthorized");
    }

    const physician = await ctx.db.get(args.physicianId);
    if (!physician || physician.role !== "physician") {
      throw new Error("Physician access required");
    }

    // Get all referrals for this physician
    const referrals = await ctx.db
      .query("referrals")
      .withIndex("by_referringPhysicianId", (q) =>
        q.eq("referringPhysicianId", args.physicianId),
      )
      .collect();

    // Get AI summaries count
    const aiSummaries = await ctx.db.query("ai_summaries").collect();

    // Calculate stats
    const totalReferrals = referrals.length;
    const pendingReferrals = referrals.filter(
      (r) => r.status === "pending",
    ).length;
    const completedReferrals = referrals.filter(
      (r) => r.status === "completed",
    ).length;
    const approvedReferrals = referrals.filter(
      (r) => r.status === "approved",
    ).length;
    const aiSummaryCount = aiSummaries.length;

    // Get recent activity
    const recentActivity = referrals.slice(0, 5).map((r) => ({
      type: "referral",
      title: `Referral #${r.referralNumber}`,
      patientName: r.patientName,
      time: new Date(r.createdAt).toLocaleDateString(),
      status: r.status,
      statusColor:
        r.status === "pending"
          ? "yellow"
          : r.status === "completed"
            ? "green"
            : "blue",
      color: "blue",
    }));

    return {
      totalReferrals,
      pendingReferrals,
      completedReferrals,
      approvedReferrals,
      aiSummaryCount,
      recentActivity,
    };
  },
});

// ============================================================================
// PHYSICIAN PROFILE QUERIES
// ============================================================================

/**
 * Get physician profile by user ID
 * Returns detailed physician information including license number and specialization
 */
export const getPhysicianProfile = query({
  args: {
    physicianId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Get the user record
    const physician = await ctx.db.get(args.physicianId);
    if (!physician || physician.role !== "physician") {
      return null;
    }

    // Get the physician profile if it exists
    const profile = await ctx.db
      .query("physicianProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.physicianId))
      .first();

    // Return combined data
    return {
      _id: physician._id,
      name: physician.name,
      email: physician.email,
      phoneNumber: physician.phoneNumber,
      hospital: physician.hospital,
      role: physician.role,
      isActive: physician.isActive,
      // Profile-specific fields
      licenseNumber: profile?.licenseNumber || physician.licenseNumber || null,
      specialization:
        profile?.specialization || physician.specialization || null,
      qualifications: profile?.qualifications || [],
      yearsOfExperience: profile?.yearsOfExperience || 0,
      consultationFee: profile?.consultationFee,
      availability: profile?.availability || [],
      verifiedAt: profile?.verifiedAt,
      joinedAt: profile?.joinedAt || physician.createdAt,
    };
  },
});

/**
 * Get multiple physician profiles by IDs (batch query)
 * Useful for fetching details for multiple physicians at once
 */
export const getPhysicianProfiles = query({
  args: {
    physicianIds: v.array(v.id("users")),
  },
  handler: async (ctx, args) => {
    const profiles = await Promise.all(
      args.physicianIds.map(async (id) => {
        const physician = await ctx.db.get(id);
        if (!physician || physician.role !== "physician") return null;

        const profile = await ctx.db
          .query("physicianProfiles")
          .withIndex("by_userId", (q) => q.eq("userId", id))
          .first();

        return {
          _id: physician._id,
          name: physician.name,
          email: physician.email,
          hospital: physician.hospital,
          licenseNumber: profile?.licenseNumber || physician.licenseNumber,
          specialization: profile?.specialization || physician.specialization,
        };
      }),
    );

    return profiles.filter((p) => p !== null);
  },
});

/**
 * Get physician by license number
 * Useful for verification purposes
 */
export const getPhysicianByLicense = query({
  args: {
    licenseNumber: v.string(),
  },
  handler: async (ctx, args) => {
    // First check physicianProfiles table
    const profile = await ctx.db
      .query("physicianProfiles")
      .filter((q) => q.eq(q.field("licenseNumber"), args.licenseNumber))
      .first();

    if (profile) {
      const physician = await ctx.db.get(profile.userId);
      if (physician) {
        return {
          ...physician,
          licenseNumber: profile.licenseNumber,
          specialization: profile.specialization,
          qualifications: profile.qualifications,
        };
      }
    }

    // Fallback to users table
    const physician = await ctx.db
      .query("users")
      .filter((q) =>
        q.and(
          q.eq(q.field("role"), "physician"),
          q.eq(q.field("licenseNumber"), args.licenseNumber),
        ),
      )
      .first();

    return physician || null;
  },
});
