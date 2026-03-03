import { query } from "../_generated/server";
import { v } from "convex/values";

export const getFacilitySubscription = query({
  args: {
    facilityId: v.id("facilities"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("facilitySubscriptions")
      .withIndex("by_facilityId", (q) => q.eq("facilityId", args.facilityId))
      .first();
  },
});

export const getSubscriptionStatus = query({
  args: {
    subscriptionId: v.id("facilitySubscriptions"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.subscriptionId);
  },
});

export const getActiveSubscriptions = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("facilitySubscriptions")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();
  },
});
