import { v } from "convex/values";
import { mutation } from "../_generated/server";

export const createFacilityForUser = mutation({
  args: {
    facilityName: v.string(),
    userEmail: v.string(),
    userPhone: v.optional(v.string()),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Check if facility already exists
    const existing = await ctx.db
      .query("facilities")
      .filter((q) => q.eq(q.field("name"), args.facilityName))
      .first();

    if (!existing) {
      // Create the facility
      const now = new Date().toISOString();
      await ctx.db.insert("facilities", {
        name: args.facilityName,
        type: "hospital",
        registrationNumber: `AUTO-${Date.now()}`,
        address: "To be updated",
        city: "To be updated",
        county: "To be updated",
        phone: args.userPhone || "To be updated",
        email: args.userEmail,
        services: ["General Medicine"],
        departments: ["General"],
        bedCapacity: 100,
        emergencyServices: true,
        operatingHours: "To be updated",
        status: "active",
        createdAt: now,
        updatedAt: now,
        createdBy: args.userId,
      });
    }
    return { success: true };
  },
});
