// convex/payments/queries.ts
import { query } from "../_generated/server";
import { v } from "convex/values";

export const getUserPayments = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // First, check if user has any payments
    const payments = await ctx.db
      .query("payments")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .order("desc")
      .collect();

    // Filter by status if provided
    if (args.status) {
      return payments.filter((p) => p.status === args.status);
    }

    // Apply limit if provided
    if (args.limit) {
      return payments.slice(0, args.limit);
    }

    return payments;
  },
});

export const getUserWallet = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    try {
      const wallet = await ctx.db
        .query("patientWallets")
        .filter((q) => q.eq(q.field("userId"), args.userId))
        .first();
      return wallet;
    } catch (error) {
      // If table doesn't exist or error occurs, return null gracefully
      console.error("Error fetching wallet:", error);
      return null;
    }
  },
});

export const getPaymentByReference = query({
  args: {
    reference: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("payments")
      .filter((q) => q.eq(q.field("reference"), args.reference))
      .first();
  },
});
