import { v } from "convex/values";
import { query } from "../_generated/server";

export const getFacilityByName = query({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("facilities")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();
  },
});

export const getFacilityById = query({
  args: {
    facilityId: v.id("facilities"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.facilityId);
  },
});

export const getActiveFacilities = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("facilities")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();
  },
});

export const getAllFacilities = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("facilities").collect();
  },
});

export const getFacilitiesByCounty = query({
  args: {
    county: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("facilities")
      .withIndex("by_county", (q) => q.eq("county", args.county))
      .collect();
  },
});

export const getFacilitiesByCity = query({
  args: {
    city: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("facilities")
      .withIndex("by_city", (q) => q.eq("city", args.city))
      .collect();
  },
});

export const getFacilitiesByType = query({
  args: {
    type: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("facilities")
      .withIndex("by_type", (q) => q.eq("type", args.type as any))
      .collect();
  },
});

export const getPhysiciansByFacility = query({
  args: {
    facilityId: v.id("facilities"),
  },
  handler: async (ctx, args) => {
    // Get all physician profiles for this facility
    const physicianProfiles = await ctx.db
      .query("physicianProfiles")
      .withIndex("by_facilityId", (q) => q.eq("facilityId", args.facilityId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Enrich with user details
    const physiciansWithUserDetails = await Promise.all(
      physicianProfiles.map(async (profile) => {
        const user = await ctx.db.get(profile.userId);
        return {
          ...profile,
          user: user
            ? {
                name: user.name,
                email: user.email,
              }
            : null,
        };
      }),
    );

    return physiciansWithUserDetails;
  },
});
