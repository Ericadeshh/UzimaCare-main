// convex/payments.ts
import { v } from "convex/values";
import { mutation, query, action, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// ============================================================================
// INTERNAL MUTATIONS
// ============================================================================

/**
 * Insert a new payment record into the database
 * This is called internally when initiating a payment
 */
export const insertPayment = internalMutation({
  args: {
    amount: v.number(),
    phoneNumber: v.string(),
    userId: v.optional(v.id("users")),
    referralId: v.optional(v.id("referrals")),
  },
  handler: async (ctx, args) => {
    console.log(`📝 Creating new payment record for ${args.phoneNumber}`);
    const paymentId = await ctx.db.insert("payments", {
      amount: args.amount,
      phoneNumber: args.phoneNumber,
      userId: args.userId,
      referralId: args.referralId,
      status: "pending",
      createdAt: Date.now(),
    });
    console.log(`✅ Payment record created with ID: ${paymentId}`);
    return paymentId;
  },
});

/**
 * Update a payment with the M-Pesa CheckoutRequestID after STK push initiation
 */
export const updatePaymentCheckoutId = internalMutation({
  args: {
    paymentId: v.id("payments"),
    checkoutRequestId: v.string(),
  },
  handler: async (ctx, args) => {
    console.log(
      `🆔 Updating payment ${args.paymentId} with CheckoutRequestID: ${args.checkoutRequestId}`,
    );
    await ctx.db.patch(args.paymentId, {
      checkoutRequestId: args.checkoutRequestId,
      updatedAt: Date.now(),
    });
    console.log(`✅ Payment ${args.paymentId} updated with CheckoutRequestID`);
  },
});

/**
 * Mark a payment as failed (used when STK push fails)
 */
export const markPaymentAsFailed = internalMutation({
  args: {
    paymentId: v.id("payments"),
    failureReason: v.string(),
  },
  handler: async (ctx, args) => {
    console.log(
      `❌ Marking payment ${args.paymentId} as failed: ${args.failureReason}`,
    );
    await ctx.db.patch(args.paymentId, {
      status: "failed",
      failureReason: args.failureReason,
      updatedAt: Date.now(),
    });
    console.log(`✅ Payment ${args.paymentId} marked as failed`);
  },
});

// ============================================================================
// PUBLIC MUTATIONS
// ============================================================================

/**
 * Update payment status from M-Pesa callback
 * This is called by the webhook endpoint when M-Pesa sends a payment notification
 */
export const updatePaymentStatusFromCallback = mutation({
  args: {
    checkoutRequestId: v.string(),
    status: v.union(v.literal("completed"), v.literal("failed")),
    transactionId: v.optional(v.string()),
    amount: v.optional(v.number()),
    phoneNumber: v.optional(v.union(v.string(), v.number())),
    failureReason: v.optional(v.string()),
    mpesaReceiptNumber: v.optional(v.string()),
    transactionDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    console.log(
      `📞 Callback received for CheckoutRequestID: ${args.checkoutRequestId}`,
    );
    console.log("📦 Callback args:", JSON.stringify(args, null, 2));

    // Find the payment by CheckoutRequestID
    const payment = await ctx.db
      .query("payments")
      .withIndex("by_checkoutRequestId", (q) =>
        q.eq("checkoutRequestId", args.checkoutRequestId),
      )
      .first();

    if (!payment) {
      console.error(
        `❌ Payment not found for checkoutRequestId: ${args.checkoutRequestId}`,
      );
      return { success: false, error: "Payment not found" };
    }

    console.log(
      `✅ Found payment: ${payment._id} with current status: ${payment.status}`,
    );

    // Prepare updates with all available callback data
    const updates: any = {
      status: args.status,
      updatedAt: Date.now(),
    };

    if (args.transactionId) {
      updates.transactionId = args.transactionId;
    }

    if (args.mpesaReceiptNumber) {
      updates.mpesaReceiptNumber = args.mpesaReceiptNumber;
      console.log(`🧾 M-Pesa Receipt: ${args.mpesaReceiptNumber}`);
    }

    if (args.transactionDate) {
      updates.transactionDate = args.transactionDate;
    }

    if (args.phoneNumber) {
      updates.phoneNumber = String(args.phoneNumber).replace(".0", "");
    }

    if (args.failureReason) {
      updates.failureReason = args.failureReason;
    }

    await ctx.db.patch(payment._id, updates);
    console.log(
      `✅ Payment ${payment._id} updated from ${payment.status} to ${args.status}`,
    );

    // ========== CRITICAL FIX: AUTO-APPROVE REFERRAL ON PAYMENT SUCCESS ==========
    if (payment.referralId && args.status === "completed") {
      console.log(`📋 Payment completed for referral: ${payment.referralId}`);

      // Get current referral to check status
      const referral = await ctx.db.get(payment.referralId);

      if (referral && referral.status === "pending") {
        // Update referral status to approved
        await ctx.db.patch(payment.referralId, {
          status: "approved",
          approvedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          adminNotes: `Auto-approved after successful payment. Transaction: ${args.transactionId || "N/A"}, Receipt: ${args.mpesaReceiptNumber || "N/A"}`,
        });
        console.log(
          `✅ Referral ${payment.referralId} auto-approved after successful payment`,
        );
      } else if (referral) {
        console.log(
          `⚠️ Referral ${payment.referralId} has status "${referral?.status}", not updating`,
        );
      }
    }
    // ============================================================================

    return { success: true, paymentId: payment._id };
  },
});

// ============================================================================
// PUBLIC QUERIES
// ============================================================================

/**
 * Get a single payment by its ID
 */
export const getPayment = query({
  args: { paymentId: v.id("payments") },
  handler: async (ctx, args) => {
    console.log(`🔍 Fetching payment with ID: ${args.paymentId}`);
    const payment = await ctx.db.get(args.paymentId);
    console.log(
      `📦 Payment found:`,
      payment ? `${payment._id} - ${payment.status}` : "null",
    );
    return payment;
  },
});

/**
 * Get a payment by CheckoutRequestID (for callback handling)
 */
export const getPaymentByCheckoutRequestId = query({
  args: { checkoutRequestId: v.string() },
  handler: async (ctx, args) => {
    console.log(
      `🔍 Fetching payment by CheckoutRequestID: ${args.checkoutRequestId}`,
    );
    return await ctx.db
      .query("payments")
      .withIndex("by_checkoutRequestId", (q) =>
        q.eq("checkoutRequestId", args.checkoutRequestId),
      )
      .first();
  },
});

/**
 * Get all payments for a specific phone number
 * Limited to 10 most recent payments
 */
export const getPaymentsByPhone = query({
  args: { phoneNumber: v.string() },
  handler: async (ctx, args) => {
    console.log(`🔍 Fetching payments for phone: ${args.phoneNumber}`);
    const payments = await ctx.db
      .query("payments")
      .withIndex("by_phone", (q) => q.eq("phoneNumber", args.phoneNumber))
      .order("desc")
      .take(10);
    console.log(`📦 Found ${payments.length} payments`);
    return payments;
  },
});

/**
 * Get all payments for a specific referral
 */
export const getPaymentsByReferral = query({
  args: { referralId: v.id("referrals") },
  handler: async (ctx, args) => {
    console.log(`🔍 Fetching payments for referral: ${args.referralId}`);
    const payments = await ctx.db
      .query("payments")
      .withIndex("by_referralId", (q) => q.eq("referralId", args.referralId))
      .order("desc")
      .collect();
    console.log(`📦 Found ${payments.length} payments`);
    return payments;
  },
});

/**
 * Check if a referral has a completed payment
 */
export const hasCompletedPayment = query({
  args: { referralId: v.id("referrals") },
  handler: async (ctx, args) => {
    console.log(
      `🔍 Checking completed payment for referral: ${args.referralId}`,
    );
    const payments = await ctx.db
      .query("payments")
      .withIndex("by_referralId_and_status", (q) =>
        q.eq("referralId", args.referralId).eq("status", "completed"),
      )
      .collect();

    const hasCompleted = payments.length > 0;
    console.log(`📦 Referral has completed payment: ${hasCompleted}`);
    return hasCompleted;
  },
});

/**
 * Get all payments for a specific user
 */
export const getUserPayments = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    console.log(`🔍 Fetching payments for user: ${args.userId}`);
    const payments = await ctx.db
      .query("payments")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    console.log(`📦 Found ${payments.length} payments`);

    // Enrich with referral details
    const enrichedPayments = await Promise.all(
      payments.map(async (payment) => {
        if (payment.referralId) {
          const referral = await ctx.db.get(payment.referralId);
          return {
            ...payment,
            referral,
          };
        }
        return payment;
      }),
    );

    return enrichedPayments;
  },
});

/**
 * Get payment by ID with full referral details
 * This enriches the payment with the associated referral data
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

// ============================================================================
// UTILITY FUNCTIONS FOR M-PESA
// ============================================================================

/**
 * Generate timestamp in format YYYYMMDDHHmmss
 * Required by M-Pesa API
 */
const getTimestamp = (): string => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
};

/**
 * Generate M-Pesa password
 * Combines shortcode + passkey + timestamp and encodes in base64
 */
const getPassword = (
  shortcode: string,
  passkey: string,
  timestamp: string,
): string => {
  const str = shortcode + passkey + timestamp;
  return btoa(str);
};

/**
 * Get OAuth access token from Safaricom
 * Required for authenticating API requests
 */
const getAccessToken = async (): Promise<string> => {
  const consumerKey = process.env.MPESA_CONSUMER_KEY!;
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET!;
  const auth = btoa(`${consumerKey}:${consumerSecret}`);

  console.log("🔑 Requesting M-Pesa access token...");
  const response = await fetch(
    "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
    {
      headers: { Authorization: `Basic ${auth}` },
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to get access token: ${response.status}`);
  }

  const data = await response.json();
  console.log("✅ Access token obtained successfully");
  return data.access_token;
};

// ============================================================================
// PUBLIC ACTION - INITIATE STK PUSH
// ============================================================================

/**
 * Initiate an M-Pesa STK Push payment
 */
export const initiateSTKPush = action({
  args: {
    amount: v.number(),
    phoneNumber: v.union(v.string(), v.number()),
    referralId: v.optional(v.id("referrals")),
    userId: v.optional(v.id("users")),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{
    success: boolean;
    checkoutRequestId?: string;
    paymentId?: Id<"payments">;
    error?: string;
  }> => {
    const phoneNumber = String(args.phoneNumber).replace(".0", "");
    const { amount, referralId, userId } = args;

    try {
      console.log(`💰 ===== INITIATING M-PESA PAYMENT =====`);
      console.log(`   Amount: KES ${amount}`);
      console.log(`   Phone: ${phoneNumber}`);
      if (referralId) {
        console.log(`   Referral ID: ${referralId}`);
      }
      if (userId) {
        console.log(`   User ID: ${userId}`);
      }

      // Step 1: Create payment record
      console.log("📝 Creating payment record...");
      // @ts-expect-error
      const paymentId = await ctx.runMutation(internal.payments.insertPayment, {
        amount,
        phoneNumber,
        userId,
        referralId,
      });
      console.log(`   Payment record created with ID: ${paymentId}`);

      // Step 2: Generate M-Pesa required parameters
      const timestamp = getTimestamp();
      const password = getPassword(
        process.env.MPESA_SHORTCODE!,
        process.env.MPESA_PASSKEY!,
        timestamp,
      );

      // Step 3: Get access token
      const token = await getAccessToken();

      // Step 4: Prepare AccountReference
      const accountReference = referralId
        ? `REF-${referralId.slice(-8)}`
        : "UZIMACARE";

      console.log(`   Account Reference: ${accountReference}`);

      // Step 5: Make STK Push request
      console.log("📤 Sending STK push request to M-Pesa...");

      const response = await fetch(
        "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            BusinessShortCode: process.env.MPESA_SHORTCODE,
            Password: password,
            Timestamp: timestamp,
            TransactionType: "CustomerPayBillOnline",
            Amount: amount,
            PartyA: phoneNumber,
            PartyB: process.env.MPESA_SHORTCODE,
            PhoneNumber: phoneNumber,
            CallBackURL: process.env.MPESA_CALLBACK_URL!,
            AccountReference: accountReference,
            TransactionDesc: "Referral Payment",
          }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ M-Pesa HTTP error:", response.status, errorText);
        // @ts-expect-error
        await ctx.runMutation(internal.payments.markPaymentAsFailed, {
          paymentId,
          failureReason: `HTTP ${response.status}: ${errorText}`,
        });
        return {
          success: false,
          paymentId,
          error: `M-Pesa API error: ${response.status}`,
        };
      }

      const responseText = await response.text();
      console.log("📨 Raw M-Pesa response:", responseText);

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        console.error("❌ Failed to parse M-Pesa response:", responseText);
        // @ts-expect-error
        await ctx.runMutation(internal.payments.markPaymentAsFailed, {
          paymentId,
          failureReason: "Invalid JSON response from M-Pesa",
        });
        return {
          success: false,
          paymentId,
          error: "Invalid response from M-Pesa",
        };
      }

      console.log("📨 Parsed M-Pesa response:", result);

      if (result.ResponseCode === "0") {
        console.log("✅ STK push initiated successfully");

        if (result.CheckoutRequestID) {
          // @ts-expect-error
          await ctx.runMutation(internal.payments.updatePaymentCheckoutId, {
            paymentId,
            checkoutRequestId: result.CheckoutRequestID,
          });
          console.log(`   CheckoutRequestID: ${result.CheckoutRequestID}`);
        }

        return {
          success: true,
          checkoutRequestId: result.CheckoutRequestID,
          paymentId,
        };
      } else {
        console.error("❌ M-Pesa returned error:", result.ResponseDescription);
        // @ts-expect-error
        await ctx.runMutation(internal.payments.markPaymentAsFailed, {
          paymentId,
          failureReason: result.ResponseDescription || "STK push failed",
        });
        return {
          success: false,
          paymentId,
          error: result.ResponseDescription || "Payment initiation failed",
        };
      }
    } catch (error) {
      console.error("❌ STK Push error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Payment failed",
      };
    }
  },
});
