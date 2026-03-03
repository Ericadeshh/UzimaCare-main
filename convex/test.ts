import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const testCreateFacility = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    console.log("Test mutation running for facility:", args.name);

    const now = new Date().toISOString();

    const facilityId = await ctx.db.insert("facilities", {
      name: args.name,
      type: "hospital",
      registrationNumber: `TEST-${Date.now()}`,
      address: "Test Address",
      city: "Test City",
      county: "Test County",
      phone: "+254700000000",
      email: "test@test.com",
      services: ["General Medicine"],
      departments: ["General"],
      bedCapacity: 100,
      emergencyServices: true,
      operatingHours: "24/7",
      status: "active",
      createdAt: now,
      updatedAt: now,
      createdBy: "system" as any, // Temporary workaround
    });

    return { success: true, facilityId };
  },
});
