import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useState } from "react";

export function useSubscriptions(facilityId?: string) {
  const [isLoading, setIsLoading] = useState(false);

  const createSubscription = useMutation(api.subscriptions.createSubscription);
  const cancelSubscription = useMutation(api.subscriptions.cancelSubscription);
  const renewSubscription = useMutation(api.subscriptions.renewSubscription);

  const subscription = useQuery(
    api.subscriptions.getFacilitySubscription,
    facilityId ? { facilityId } : "skip",
  );

  const create = async (
    facilityId: string,
    planId: string,
    billingCycle: "monthly" | "quarterly" | "annually",
    paymentPhoneNumber: string,
    autoRenew: boolean = true,
  ) => {
    setIsLoading(true);
    try {
      const result = await createSubscription({
        facilityId,
        planId,
        billingCycle,
        paymentPhoneNumber,
        autoRenew,
      });
      return result;
    } catch (error) {
      console.error("Subscription creation failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const cancel = async (subscriptionId: string) => {
    setIsLoading(true);
    try {
      await cancelSubscription({ subscriptionId });
    } catch (error) {
      console.error("Subscription cancellation failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const renew = async (subscriptionId: string) => {
    setIsLoading(true);
    try {
      await renewSubscription({ subscriptionId });
    } catch (error) {
      console.error("Subscription renewal failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    subscription,
    create,
    cancel,
    renew,
    isLoading,
  };
}
