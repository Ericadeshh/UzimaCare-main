"use client";

import { useParams, useRouter } from "next/navigation";
import PaymentStatusPage from "@/components/payments/PaymentStatusPage";

export default function PaymentStatusRoute() {
  const params = useParams();
  const router = useRouter();

  const paymentId = params.paymentId as string;

  const handleRetry = () => {
    // Go back to the previous page (payment page)
    router.back();
  };

  const handleViewDetails = () => {
    // Navigate to referral details page
    // You can customize this based on your routing structure
    router.push(`/dashboard/referrals/${paymentId}`);
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <PaymentStatusPage
      paymentId={paymentId}
      onBack={handleBack}
      onRetry={handleRetry}
      onViewDetails={handleViewDetails}
    />
  );
}
