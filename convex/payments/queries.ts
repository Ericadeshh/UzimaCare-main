import { v } from "convex/values";
import { query } from "../_generated/server";
import { Doc, Id } from "../_generated/dataModel";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface PhysicianPaymentStats {
  totalPayments: number;
  totalAmount: number;
  completedPayments: number;
  completedAmount: number;
  pendingPayments: number;
  pendingAmount: number;
  failedPayments: number;
  failedAmount: number;
  successRate: number;
}

interface EnrichedPayment extends Doc<"payments"> {
  referral: Doc<"referrals"> | null;
}

// ============================================================================
// PAYMENT QUERIES
// ============================================================================

/**
 * Get payment by ID with full referral details
 */
export const getPaymentWithReferral = query({
  args: {
    paymentId: v.id("payments"),
  },
  handler: async (ctx, args) => {
    console.log(`🔍 Fetching payment with referral for ID: ${args.paymentId}`);

    const payment = await ctx.db.get(args.paymentId);
    if (!payment) {
      console.log(`⚠️ Payment not found: ${args.paymentId}`);
      return null;
    }

    console.log(`📦 Payment found: ${payment._id} - ${payment.status}`);

    // If payment has a referralId, fetch the referral details
    let referral = null;
    if (payment.referralId) {
      referral = await ctx.db.get(payment.referralId);
      console.log(`📋 Referral found: ${referral?._id}`);
    }

    return {
      ...payment,
      referral,
    };
  },
});

/**
 * Get payment by CheckoutRequestID (for callback handling)
 */
export const getPaymentByCheckoutRequestId = query({
  args: {
    checkoutRequestId: v.string(),
  },
  handler: async (ctx, args) => {
    console.log(
      `🔍 Fetching payment by CheckoutRequestID: ${args.checkoutRequestId}`,
    );
    const payment = await ctx.db
      .query("payments")
      .withIndex("by_checkoutRequestId", (q) =>
        q.eq("checkoutRequestId", args.checkoutRequestId),
      )
      .first();

    console.log(`📦 Payment found: ${payment ? payment._id : "null"}`);
    return payment;
  },
});

/**
 * Get all payments for a physician (based on their referrals)
 * Supports pagination with offset and limit
 */
export const getPhysicianPayments = query({
  args: {
    token: v.string(),
    physicianId: v.id("users"),
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("completed"),
        v.literal("failed"),
      ),
    ),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<EnrichedPayment[]> => {
    console.log(`🔍 Fetching payments for physician: ${args.physicianId}`);

    // Validate physician access
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!session || session.userId !== args.physicianId) {
      console.error("❌ Unauthorized access attempt");
      throw new Error("Unauthorized");
    }

    // First get all referrals for this physician
    const referrals = await ctx.db
      .query("referrals")
      .withIndex("by_referringPhysicianId", (q) =>
        q.eq("referringPhysicianId", args.physicianId),
      )
      .collect();

    const referralIds = referrals.map((r) => r._id);
    console.log(`📋 Found ${referralIds.length} referrals for physician`);

    if (referralIds.length === 0) {
      return [];
    }

    // Get all payments
    const allPayments = await ctx.db.query("payments").collect();

    // Filter payments that belong to this physician's referrals
    let payments = allPayments.filter(
      (p) => p.referralId && referralIds.includes(p.referralId),
    );

    console.log(`💰 Found ${payments.length} total payments`);

    // Filter by status if provided
    if (args.status) {
      payments = payments.filter((p) => p.status === args.status);
      console.log(
        `   Filtered by status ${args.status}: ${payments.length} payments`,
      );
    }

    // Sort by createdAt descending (newest first)
    payments.sort((a, b) => b.createdAt - a.createdAt);

    // Apply pagination
    const offset = args.offset || 0;
    const limit = args.limit || 20;
    const paginatedPayments = payments.slice(offset, offset + limit);

    // Enrich with referral details
    const enrichedPayments = await Promise.all(
      paginatedPayments.map(async (payment) => {
        const referral = payment.referralId
          ? await ctx.db.get(payment.referralId)
          : null;
        return {
          ...payment,
          referral,
        };
      }),
    );

    console.log(`✅ Returning ${enrichedPayments.length} enriched payments`);
    return enrichedPayments;
  },
});

/**
 * Get payment statistics for a physician
 * Returns aggregated stats for dashboard display
 */
export const getPhysicianPaymentStats = query({
  args: {
    token: v.string(),
    physicianId: v.id("users"),
  },
  handler: async (ctx, args): Promise<PhysicianPaymentStats> => {
    console.log(`📊 Fetching payment stats for physician: ${args.physicianId}`);

    // Validate physician access
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!session || session.userId !== args.physicianId) {
      console.error("❌ Unauthorized access attempt");
      throw new Error("Unauthorized");
    }

    // Get all referrals for this physician
    const referrals = await ctx.db
      .query("referrals")
      .withIndex("by_referringPhysicianId", (q) =>
        q.eq("referringPhysicianId", args.physicianId),
      )
      .collect();

    const referralIds = referrals.map((r) => r._id);
    console.log(`📋 Found ${referralIds.length} referrals`);

    if (referralIds.length === 0) {
      return {
        totalPayments: 0,
        totalAmount: 0,
        completedPayments: 0,
        completedAmount: 0,
        pendingPayments: 0,
        pendingAmount: 0,
        failedPayments: 0,
        failedAmount: 0,
        successRate: 0,
      };
    }

    // Get all payments
    const allPayments = await ctx.db.query("payments").collect();
    const physicianPayments = allPayments.filter(
      (p) => p.referralId && referralIds.includes(p.referralId),
    );

    console.log(`💰 Found ${physicianPayments.length} payments for stats`);

    // Calculate statistics
    const completed = physicianPayments.filter((p) => p.status === "completed");
    const pending = physicianPayments.filter((p) => p.status === "pending");
    const failed = physicianPayments.filter((p) => p.status === "failed");

    const stats: PhysicianPaymentStats = {
      totalPayments: physicianPayments.length,
      totalAmount: physicianPayments.reduce((sum, p) => sum + p.amount, 0),

      completedPayments: completed.length,
      completedAmount: completed.reduce((sum, p) => sum + p.amount, 0),

      pendingPayments: pending.length,
      pendingAmount: pending.reduce((sum, p) => sum + p.amount, 0),

      failedPayments: failed.length,
      failedAmount: failed.reduce((sum, p) => sum + p.amount, 0),

      successRate: 0,
    };

    // Calculate success rate
    stats.successRate =
      stats.totalPayments > 0
        ? Math.round((stats.completedPayments / stats.totalPayments) * 100)
        : 0;

    console.log(`✅ Stats calculated:`, {
      totalPayments: stats.totalPayments,
      totalAmount: stats.totalAmount,
      successRate: stats.successRate,
    });

    return stats;
  },
});

/**
 * Get payment by M-Pesa receipt number
 */
export const getPaymentByReceiptNumber = query({
  args: {
    receiptNumber: v.string(),
  },
  handler: async (ctx, args) => {
    console.log(`🔍 Fetching payment by receipt number: ${args.receiptNumber}`);
    const payments = await ctx.db.query("payments").collect();
    const payment =
      payments.find((p) => p.mpesaReceiptNumber === args.receiptNumber) || null;
    console.log(`📦 Payment found: ${payment ? payment._id : "null"}`);
    return payment;
  },
});

/**
 * Get recent payments for a physician (for dashboard widget)
 * This is a separate query that calls getPhysicianPayments internally
 */
export const getRecentPhysicianPayments = query({
  args: {
    token: v.string(),
    physicianId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<EnrichedPayment[]> => {
    console.log(
      `🔍 Fetching recent payments for physician: ${args.physicianId}`,
    );

    // Get the payments using the same logic as getPhysicianPayments
    // But we can't call it directly, so we'll duplicate the logic for recent ones

    // Validate physician access
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!session || session.userId !== args.physicianId) {
      console.error("❌ Unauthorized access attempt");
      throw new Error("Unauthorized");
    }

    // Get all referrals for this physician
    const referrals = await ctx.db
      .query("referrals")
      .withIndex("by_referringPhysicianId", (q) =>
        q.eq("referringPhysicianId", args.physicianId),
      )
      .collect();

    const referralIds = referrals.map((r) => r._id);

    if (referralIds.length === 0) {
      return [];
    }

    // Get all payments
    const allPayments = await ctx.db.query("payments").collect();

    // Filter payments that belong to this physician's referrals
    let payments = allPayments.filter(
      (p) => p.referralId && referralIds.includes(p.referralId),
    );

    // Sort by createdAt descending (newest first)
    payments.sort((a, b) => b.createdAt - a.createdAt);

    // Apply limit
    const limit = args.limit || 5;
    const limitedPayments = payments.slice(0, limit);

    // Enrich with referral details
    const enrichedPayments = await Promise.all(
      limitedPayments.map(async (payment) => {
        const referral = payment.referralId
          ? await ctx.db.get(payment.referralId)
          : null;
        return {
          ...payment,
          referral,
        };
      }),
    );

    console.log(`✅ Returning ${enrichedPayments.length} recent payments`);
    return enrichedPayments;
  },
});

/**
 * Get payment by transaction ID
 */
export const getPaymentByTransactionId = query({
  args: {
    transactionId: v.string(),
  },
  handler: async (ctx, args) => {
    console.log(`🔍 Fetching payment by transaction ID: ${args.transactionId}`);
    const payments = await ctx.db.query("payments").collect();
    const payment =
      payments.find((p) => p.transactionId === args.transactionId) || null;
    console.log(`📦 Payment found: ${payment ? payment._id : "null"}`);
    return payment;
  },
});
