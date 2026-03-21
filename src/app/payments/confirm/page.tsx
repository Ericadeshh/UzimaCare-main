"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { CheckCircle2, XCircle, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

function PaymentConfirmContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"processing" | "success" | "failed">(
    "processing",
  );

  const transactionId = searchParams.get("transactionId");
  const checkoutRequestId = searchParams.get("checkoutRequestId");
  const statusParam = searchParams.get("status");

  // Fetch payment details
  const payment = useQuery(
    api.payments.getPaymentByCheckoutRequestId,
    checkoutRequestId ? { checkoutRequestId } : "skip",
  );

  useEffect(() => {
    if (statusParam === "success" || payment?.status === "completed") {
      setStatus("success");
    } else if (statusParam === "failed" || payment?.status === "failed") {
      setStatus("failed");
    } else if (payment?.status === "pending") {
      // Still processing, keep polling
      setStatus("processing");
    }
  }, [payment, statusParam]);

  if (status === "processing") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-800 mb-2">
            Verifying Payment
          </h1>
          <p className="text-gray-600">
            Please wait while we confirm your transaction...
          </p>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-emerald-50 py-12">
        <div className="container mx-auto px-4 max-w-md">
          <Card className="border-0 shadow-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white text-center">
              <div className="w-20 h-20 bg-white/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold">
                Payment Successful!
              </CardTitle>
              <p className="text-white/80 mt-2">
                Your referral payment has been processed.
              </p>
            </CardHeader>
            <CardContent className="p-6 text-center">
              <div className="space-y-4">
                {transactionId && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-500">Transaction ID</p>
                    <p className="font-mono text-sm">{transactionId}</p>
                  </div>
                )}
                <div className="flex gap-3">
                  <Link href="/dashboard/send/physician" className="flex-1">
                    <Button className="w-full bg-green-600 hover:bg-green-700">
                      Back to Dashboard
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-orange-50 py-12">
      <div className="container mx-auto px-4 max-w-md">
        <Card className="border-0 shadow-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-red-600 to-orange-600 text-white text-center">
            <div className="w-20 h-20 bg-white/20 rounded-full mx-auto mb-4 flex items-center justify-center">
              <XCircle className="w-10 h-10 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold">Payment Failed</CardTitle>
            <p className="text-white/80 mt-2">
              Your payment could not be processed.
            </p>
          </CardHeader>
          <CardContent className="p-6 text-center">
            <div className="bg-red-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-700">
                {payment?.failureReason ||
                  "Please try again or contact support."}
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => router.back()}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function PaymentConfirmPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
        </div>
      }
    >
      <PaymentConfirmContent />
    </Suspense>
  );
}
