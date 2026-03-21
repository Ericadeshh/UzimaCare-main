// src/lib/payment.ts
// Payment processing and referral payment logic
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "@convex/_generated/api";
import { formatPhoneNumber } from "./mpesa/utils";
import { Id } from "@convex/_generated/dataModel";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  message: string;
  paymentId?: string;
  checkoutRequestID?: string;
  error?: string;
}

export interface PaymentStatus {
  status: "pending" | "completed" | "failed" | "not_found";
  payment?: any;
  referral?: any;
}

// ============================================================================
// PAYMENT INITIATION
// ============================================================================

/**
 * Initiate M-Pesa STK Push payment for a referral
 * This is the main function to call when a physician needs to pay for a referral
 *
 * @param referralId - The ID of the referral being paid for
 * @param phoneNumber - Patient's or physician's phone number for M-Pesa
 * @param amount - Amount to charge (should match REFERRAL_FEE from config)
 * @param userId - ID of the physician making the payment
 *
 * @returns PaymentResult with success status and payment details
 */
export async function sendSTKPaymentPrompt(
  referralId: string,
  phoneNumber: string,
  amount: number,
  userId?: string,
): Promise<PaymentResult> {
  try {
    // Log payment initiation
    console.log(`💰 Initiating payment for referral: ${referralId}`);
    console.log(`   Amount: KES ${amount}`);
    console.log(`   Phone: ${phoneNumber}`);

    // Format phone number to international format (254...)
    const formattedPhone = formatPhoneNumber(phoneNumber);
    console.log(`   Formatted phone: ${formattedPhone}`);

    // Call Convex action to initiate STK push
    // IMPORTANT: Pass referralId to link payment to the referral
    const result = await fetchMutation(api.payments.initiateSTKPush, {
      amount,
      phoneNumber: formattedPhone,
      userId: userId as any, // Cast to any to satisfy Convex ID type
      referralId: referralId as any, // Pass referralId to link payment
    });

    // Handle the result
    if (!result.success) {
      console.error("❌ STK Push failed:", result.error);
      return {
        success: false,
        message: result.error || "Failed to send STK prompt. Please try again.",
        error: result.error,
      };
    }

    console.log("✅ STK Push initiated successfully");
    console.log(`   CheckoutRequestID: ${result.checkoutRequestId}`);
    console.log(`   Payment ID: ${result.paymentId}`);

    // Return success with payment details
    return {
      success: true,
      transactionId: result.checkoutRequestId,
      paymentId: result.paymentId,
      checkoutRequestID: result.checkoutRequestId,
      message: `STK prompt sent to ${phoneNumber}. Please check your phone and enter your PIN to complete payment.`,
    };
  } catch (error: any) {
    console.error("❌ STK Push failed with exception:", error);
    return {
      success: false,
      message: error.message || "Failed to send STK prompt. Please try again.",
      error: error.message,
    };
  }
}

// ============================================================================
// PAYMENT STATUS CHECKING
// ============================================================================

/**
 * Check the status of a payment
 * Can be used to poll for payment completion
 *
 * @param paymentId - The ID of the payment to check
 * @returns Payment status with payment and referral details if available
 */
export async function checkPaymentStatus(
  paymentId: string,
): Promise<PaymentStatus> {
  try {
    console.log(`🔍 Checking payment status for: ${paymentId}`);

    // First try to get basic payment info
    const payment = await fetchQuery(api.payments.getPayment, {
      paymentId: paymentId as any,
    });

    if (!payment) {
      console.log("   Payment not found");
      return { status: "not_found" };
    }

    console.log(`   Payment status: ${payment.status}`);

    // If payment has a referralId, fetch the referral details
    let referral = null;
    if (payment.referralId) {
      try {
        // Use the correct query that only requires referralId
        referral = await fetchQuery(api.referrals.queries.getReferralById, {
          referralId: payment.referralId as any,
        });
      } catch (refError) {
        console.log("   Could not fetch referral details:", refError);
      }
    }

    return {
      status: payment.status,
      payment,
      referral,
    };
  } catch (error) {
    console.error("❌ Failed to check payment status:", error);
    return { status: "not_found" };
  }
}

/**
 * Poll for payment completion
 * Useful for waiting for M-Pesa callback
 *
 * @param paymentId - The ID of the payment to poll
 * @param maxAttempts - Maximum number of polling attempts (default: 30)
 * @param intervalMs - Interval between polls in milliseconds (default: 2000)
 * @returns Final payment status
 */
export async function pollPaymentStatus(
  paymentId: string,
  maxAttempts: number = 30,
  intervalMs: number = 2000,
): Promise<PaymentStatus> {
  console.log(`🔄 Starting payment status polling for: ${paymentId}`);
  console.log(`   Max attempts: ${maxAttempts}, Interval: ${intervalMs}ms`);

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`   Polling attempt ${attempt}/${maxAttempts}`);

    const status = await checkPaymentStatus(paymentId);

    // If payment is completed or failed, stop polling
    if (status.status === "completed" || status.status === "failed") {
      console.log(`   Payment reached final state: ${status.status}`);
      return status;
    }

    // Wait before next attempt (except on last attempt)
    if (attempt < maxAttempts) {
      console.log(`   Waiting ${intervalMs}ms before next attempt...`);
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  }

  console.log("⏰ Polling timed out - payment still pending");
  return { status: "pending" };
}

// ============================================================================
// PAYMENT HISTORY & MANAGEMENT
// ============================================================================

/**
 * Get payment history for a physician
 *
 * @param token - Authentication token
 * @param physicianId - ID of the physician
 * @param status - Optional filter by payment status
 * @param limit - Optional limit on number of results
 * @returns Array of payments with referral details
 */
export async function getPhysicianPaymentHistory(
  token: string,
  physicianId: string,
  status?: "pending" | "completed" | "failed",
  limit?: number,
) {
  try {
    console.log(`📋 Fetching payment history for physician: ${physicianId}`);

    const payments = await fetchQuery(
      api.payments.queries.getPhysicianPayments,
      {
        token,
        physicianId: physicianId as any,
        status,
        limit,
      },
    );

    console.log(`   Found ${payments.length} payments`);
    return payments;
  } catch (error) {
    console.error("❌ Failed to fetch payment history:", error);
    return [];
  }
}

/**
 * Get payment statistics for a physician
 * Useful for dashboard cards
 *
 * @param token - Authentication token
 * @param physicianId - ID of the physician
 * @returns Payment statistics
 */
export async function getPhysicianPaymentStats(
  token: string,
  physicianId: string,
) {
  try {
    console.log(`📊 Fetching payment stats for physician: ${physicianId}`);

    const stats = await fetchQuery(
      api.payments.queries.getPhysicianPaymentStats,
      {
        token,
        physicianId: physicianId as any,
      },
    );

    return stats;
  } catch (error) {
    console.error("❌ Failed to fetch payment stats:", error);
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
}

// ============================================================================
// LEGACY FUNCTIONS (Keep for backward compatibility)
// ============================================================================

/**
 * @deprecated Use sendSTKPaymentPrompt instead
 */
export async function sendSTKPaymentPrompt_old(
  bookingId: string,
  phoneNumber: string,
  amount: number,
  userId?: string,
): Promise<PaymentResult> {
  return sendSTKPaymentPrompt(bookingId, phoneNumber, amount, userId);
}

// Confirm payment manually (admin function)
export async function confirmPayment(
  bookingId: string,
  mpesaReceiptNumber?: string,
): Promise<PaymentResult> {
  try {
    // This function is kept for backward compatibility
    // In the new system, payments are confirmed via callback

    return {
      success: true,
      transactionId: mpesaReceiptNumber,
      message: "Payment confirmed manually",
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Failed to confirm payment",
    };
  }
}

// Check and expire old bookings
export async function checkAndExpireBookings() {
  // This would be a scheduled job in Convex
  // Kept for backward compatibility
  return {
    expiredBookings: [],
    activeBookings: [],
  };
}

// Get available slots for a clinic
export function getAvailableSlots(
  clinicId: string,
  date: string,
  maxPerDay = 15,
) {
  const allSlots = [
    "09:00",
    "09:30",
    "10:00",
    "10:30",
    "11:00",
    "11:30",
    "14:00",
    "14:30",
    "15:00",
    "15:30",
    "16:00",
    "16:30",
  ];

  // This should be fetched from Convex
  // For now, return all slots as available
  return {
    available: allSlots,
    isFull: false,
    availableCount: allSlots.length,
  };
}

// Get available dates
export function getAvailableDates(
  clinicId: string,
  startDate: Date,
  daysAhead = 30,
): string[] {
  const available: string[] = [];

  for (let i = 0; i < daysAhead; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);

    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    const dateStr = date.toISOString().split("T")[0];
    const slots = getAvailableSlots(clinicId, dateStr);

    if (slots.available.length > 0) {
      available.push(dateStr);
    }
  }

  return available;
}
