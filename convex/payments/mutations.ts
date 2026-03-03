// convex/payments/mutations.ts
import { mutation } from "../_generated/server";
import { v } from "convex/values";

// MUST have 'export' keyword
export const initiateSTKPush = mutation({
  args: {
    amount: v.number(),
    phoneNumber: v.string(),
    paymentType: v.union(
      v.literal("booking"),
      v.literal("subscription"),
      v.literal("onboarding"),
      v.literal("referral_fee"),
      v.literal("wallet_topup"),
    ),
    userId: v.optional(v.id("users")),
    facilityId: v.optional(v.id("facilities")),
    relatedEntityId: v.optional(v.string()),
    relatedEntityType: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    // Your existing handler code...
    return { success: true, paymentId: "test" };
  },
});

export const checkPaymentStatus = mutation({
  args: {
    paymentId: v.id("payments"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.paymentId);
  },
});

export const handleSTKCallback = mutation({
  args: {
    body: v.any(),
  },
  handler: async (ctx, args) => {
    // Your callback handler
    return { success: true };
  },
});
export const test = mutation({
  args: {},
  handler: async () => {
    return { message: "Payment functions are working!" };
  },
});
