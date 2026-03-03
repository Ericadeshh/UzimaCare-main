import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

export function usePayments() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const initiatePayment = useMutation(api.payments.initiateSTKPush);
  const checkStatus = useMutation(api.payments.checkPaymentStatus);
  const userPayments = useQuery(
    api.payments.getUserPayments,
    user ? { userId: user._id } : "skip",
  );
  const wallet = useQuery(
    api.payments.getUserWallet,
    user ? { userId: user._id } : "skip",
  );

  const makePayment = async (
    amount: number,
    phoneNumber: string,
    paymentType:
      | "booking"
      | "subscription"
      | "onboarding"
      | "referral_fee"
      | "wallet_topup",
    relatedEntityId?: string,
    relatedEntityType?: string,
    metadata?: any,
  ) => {
    setIsLoading(true);
    try {
      const result = await initiatePayment({
        amount,
        phoneNumber,
        paymentType,
        userId: user?._id,
        relatedEntityId,
        relatedEntityType,
        metadata,
      });
      return result;
    } catch (error) {
      console.error("Payment initiation failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const checkPayment = async (paymentId: string) => {
    return await checkStatus({ paymentId });
  };

  return {
    makePayment,
    checkPayment,
    userPayments,
    wallet,
    isLoading,
  };
}
