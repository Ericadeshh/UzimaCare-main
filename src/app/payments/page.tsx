"use client";

import { useSearchParams } from "next/navigation";
import { MpesaPayment } from "@/components/payments/MpesaPayment";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CreditCard } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

function PaymentsContent() {
  const searchParams = useSearchParams();
  const referralId = searchParams.get("referralId");
  const patientName = searchParams.get("patientName");
  const amount = searchParams.get("amount");

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link href="/dashboard/send/admin">
            <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back to Dashboard</span>
            </button>
          </Link>
          <div className="flex items-center gap-3">
            <CreditCard className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Make Payment</h1>
          </div>
          <p className="text-gray-500 mt-1">
            Secure M-Pesa payment for referral services
          </p>
        </div>

        {/* Payment Component */}
        <MpesaPayment
          paymentType="referral_fee"
          amount={amount ? parseInt(amount) : undefined}
          description={
            referralId
              ? "Complete your referral payment"
              : "Pay for referral services"
          }
          showAmountSelector={true}
          referralId={referralId || undefined}
          patientName={patientName || undefined}
          onSuccess={(result) => {
            if (result.paymentId) {
              window.location.href = `/payments/status/${result.paymentId}`;
            }
          }}
        />

        {/* Info Card */}
        <Card className="mt-6 border-0 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Need help?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              Having issues with your payment? Contact support at{" "}
              <a
                href="mailto:support@uzimacare.com"
                className="text-blue-600 hover:underline"
              >
                support@uzimacare.com
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function PaymentsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      }
    >
      <PaymentsContent />
    </Suspense>
  );
}
