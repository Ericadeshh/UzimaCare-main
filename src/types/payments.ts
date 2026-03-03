import { Id } from "@convex/_generated/dataModel";

export type PaymentType =
  | "booking"
  | "subscription"
  | "onboarding"
  | "referral_fee"
  | "wallet_topup";

export type RelatedEntityType =
  | "referral"
  | "physicianProfile"
  | "facility"
  | "user";

export type RelatedEntityId =
  | Id<"referrals">
  | Id<"physicianProfiles">
  | Id<"facilities">
  | Id<"users">;

export interface InitiatePaymentArgs {
  amount: number;
  phoneNumber: string;
  paymentType: PaymentType;
  userId?: Id<"users">;
  facilityId?: Id<"facilities">;
  relatedEntityId?: string;
  relatedEntityType?: RelatedEntityType;
  metadata?: any;
}
