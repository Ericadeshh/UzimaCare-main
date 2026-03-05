"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchQuery } from "convex/nextjs";
import { api } from "@convex/_generated/api";

// ============================================================================
// MOCK DATA FOR TESTING ONLY - COMMENT OUT FOR PRODUCTION
// ============================================================================

/*
const MOCK_PAYMENTS: Record<string, any> = {
  "success-test-123": {
    _id: "success-test-123",
    amount: 200,
    phoneNumber: "254712345678",
    status: "completed",
    transactionId: "OEI2J4H5K6",
    mpesaReceiptNumber: "MPS123456789",
    createdAt: Date.now() - 300000,
    updatedAt: Date.now() - 240000,
    referralId: "referral-success-123",
    failureReason: null,
  },
  "failed-test-123": {
    _id: "failed-test-123",
    amount: 200,
    phoneNumber: "254712345678",
    status: "failed",
    transactionId: null,
    mpesaReceiptNumber: null,
    createdAt: Date.now() - 600000,
    updatedAt: Date.now() - 590000,
    referralId: "referral-failed-123",
    failureReason: "Transaction cancelled by user",
  },
  "pending-test-123": {
    _id: "pending-test-123",
    amount: 200,
    phoneNumber: "254712345678",
    status: "pending",
    transactionId: null,
    mpesaReceiptNumber: null,
    createdAt: Date.now() - 120000,
    updatedAt: null,
    referralId: "referral-pending-123",
    failureReason: null,
  },
};

const MOCK_REFERRALS: Record<string, any> = {
  "referral-success-123": {
    _id: "referral-success-123",
    patientName: "John Mwangi",
    patientAge: 45,
    patientGender: "male",
    referringHospital: "Kisumu County Hospital",
    referredToFacility: "Kenyatta National Hospital",
    urgency: "urgent",
    createdAt: Date.now() - 3600000,
    referralNumber: "REF-2024-00123",
    diagnosis: "Severe hypertension with complications",
  },
  "referral-failed-123": {
    _id: "referral-failed-123",
    patientName: "Mary Akinyi",
    patientAge: 32,
    patientGender: "female",
    referringHospital: "Mombasa Teaching Hospital",
    referredToFacility: "Aga Khan Hospital",
    urgency: "routine",
    createdAt: Date.now() - 7200000,
    referralNumber: "REF-2024-00124",
    diagnosis: "Diabetes mellitus type 2",
  },
  "referral-pending-123": {
    _id: "referral-pending-123",
    patientName: "Peter Omondi",
    patientAge: 28,
    patientGender: "male",
    referringHospital: "Eldoret Referral Hospital",
    referredToFacility: "Moi Teaching Hospital",
    urgency: "emergency",
    createdAt: Date.now() - 1800000,
    referralNumber: "REF-2024-00125",
    diagnosis: "Acute appendicitis",
  },
};
*/

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface UsePaymentStatusReturn {
  status: "pending" | "completed" | "failed" | "not_found";
  payment: any | null;
  referral: any | null;
  error: string | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

// ============================================================================
// CUSTOM HOOK FOR PAYMENT STATUS - PRODUCTION VERSION
// ============================================================================

export function usePaymentStatus(paymentId: string): UsePaymentStatusReturn {
  const [status, setStatus] = useState<
    "pending" | "completed" | "failed" | "not_found"
  >("pending");
  const [payment, setPayment] = useState<any | null>(null);
  const [referral, setReferral] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Function to fetch payment status
  const fetchStatus = useCallback(async () => {
    if (!paymentId) return;

    try {
      console.log(
        `🔍 [usePaymentStatus] Fetching status for payment: ${paymentId}`,
      );

      // FOR TESTING: Uncomment this block to use mock data
      /*
      if (paymentId in MOCK_PAYMENTS) {
        console.log("   Using MOCK data for testing");
        const mockPayment = MOCK_PAYMENTS[paymentId];
        const mockReferral = mockPayment.referralId ? MOCK_REFERRALS[mockPayment.referralId] : null;
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setPayment(mockPayment);
        setReferral(mockReferral);
        setStatus(mockPayment.status);
        setError(mockPayment.failureReason || null);
        setIsLoading(false);
        return;
      }
      */

      // PRODUCTION: Real database query
      const result = await fetchQuery(
        api.payments.queries.getPaymentWithReferral,
        {
          paymentId: paymentId as any,
        },
      );

      if (!result) {
        console.log("   Payment not found");
        setStatus("not_found");
        setPayment(null);
        setReferral(null);
        setError("Payment not found");
        return;
      }

      console.log(`   Payment status: ${result.status}`);
      setPayment(result);
      setReferral(result.referral);
      setStatus(result.status);
      setError(result.failureReason || null);
    } catch (err) {
      console.error("❌ Error fetching payment status:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch payment status",
      );
    } finally {
      setIsLoading(false);
    }
  }, [paymentId]);

  // Initial fetch
  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Set up polling for pending payments
  useEffect(() => {
    if (status !== "pending") return;

    console.log("⏰ Setting up polling for pending payment...");

    const interval = setInterval(() => {
      console.log("   Polling payment status...");
      fetchStatus();
    }, 3000);

    return () => {
      console.log("   Cleaning up polling interval");
      clearInterval(interval);
    };
  }, [status, fetchStatus]);

  return {
    status,
    payment,
    referral,
    error,
    isLoading,
    refresh: fetchStatus,
  };
}
