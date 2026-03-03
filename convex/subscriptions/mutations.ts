import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { SUBSCRIPTION_PLANS } from "../../src/lib/mpesa-config";

export const createSubscription = mutation({
  args: {
    facilityId: v.id("facilities"),
    planId: v.string(),
    billingCycle: v.union(
      v.literal("monthly"),
      v.literal("quarterly"),
      v.literal("annually"),
    ),
    paymentPhoneNumber: v.string(),
    autoRenew: v.boolean(),
  },
  handler: async (ctx, args) => {
    const planKey =
      args.planId.toUpperCase() as keyof typeof SUBSCRIPTION_PLANS;
    const plan = SUBSCRIPTION_PLANS[planKey];

    if (!plan) {
      throw new Error("Invalid plan ID");
    }

    // Calculate price based on billing cycle
    let amount = plan.price;
    if (args.billingCycle === "quarterly") {
      amount = plan.price * 3;
    } else if (args.billingCycle === "annually") {
      amount = plan.price * 12 * 0.9; // 10% discount for annual
    }

    const startDate = new Date();
    const endDate = new Date();

    if (args.billingCycle === "monthly") {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (args.billingCycle === "quarterly") {
      endDate.setMonth(endDate.getMonth() + 3);
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    // Convert readonly array to mutable array
    const features = [...plan.features];

    // Check if subscription already exists
    const existing = await ctx.db
      .query("facilitySubscriptions")
      .withIndex("by_facilityId", (q) => q.eq("facilityId", args.facilityId))
      .first();

    if (existing) {
      // Update existing subscription
      await ctx.db.patch(existing._id, {
        planId: args.planId,
        planName: plan.name,
        amount,
        billingCycle: args.billingCycle,
        status: "pending",
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        nextBillingDate: endDate.toISOString(),
        autoRenew: args.autoRenew,
        paymentPhoneNumber: args.paymentPhoneNumber,
        features,
        maxReferrals: plan.maxReferrals,
        maxUsers: plan.maxUsers,
        updatedAt: new Date().toISOString(),
      });

      return existing._id;
    } else {
      // Create new subscription
      const subscriptionId = await ctx.db.insert("facilitySubscriptions", {
        facilityId: args.facilityId,
        planId: args.planId,
        planName: plan.name,
        amount,
        billingCycle: args.billingCycle,
        status: "pending",
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        nextBillingDate: endDate.toISOString(),
        autoRenew: args.autoRenew,
        paymentPhoneNumber: args.paymentPhoneNumber,
        features,
        maxReferrals: plan.maxReferrals,
        maxUsers: plan.maxUsers,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      return subscriptionId;
    }
  },
});

export const cancelSubscription = mutation({
  args: {
    subscriptionId: v.id("facilitySubscriptions"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.subscriptionId, {
      status: "cancelled",
      autoRenew: false,
      updatedAt: new Date().toISOString(),
    });

    return { success: true };
  },
});

export const renewSubscription = mutation({
  args: {
    subscriptionId: v.id("facilitySubscriptions"),
  },
  handler: async (ctx, args) => {
    const subscription = await ctx.db.get(args.subscriptionId);

    if (!subscription) {
      throw new Error("Subscription not found");
    }

    const startDate = new Date();
    const endDate = new Date();

    if (subscription.billingCycle === "monthly") {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (subscription.billingCycle === "quarterly") {
      endDate.setMonth(endDate.getMonth() + 3);
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    await ctx.db.patch(args.subscriptionId, {
      status: "active",
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      nextBillingDate: endDate.toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return { success: true };
  },
});
