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
