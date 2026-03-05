"use client";

import { useSearchParams } from "next/navigation";
import { MpesaPayment } from "@/components/payments/MpesaPayment";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

function PaymentsContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();

  const referralId = searchParams.get("referralId");
  const patientName = searchParams.get("patientName");
  const amount = searchParams.get("amount");

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="container mx-auto py-8 px-4">
        {/* Back Button */}
        {referralId && (
          <Link
            href="/dashboard/send/physician"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        )}

        <h1 className="text-3xl font-bold text-gray-800 mb-2">Payments</h1>
        <p className="text-gray-600 mb-8">
          Secure M-Pesa payments for UzimaCare services
        </p>

        <Tabs defaultValue={referralId ? "pay" : "pay"} className="space-y-6">
          <TabsList className="bg-white/50 backdrop-blur-sm">
            <TabsTrigger value="pay">Make Payment</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="pay">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Payment Component - This will now show the same UI on both URLs */}
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
                  // Redirect to status page after successful payment initiation
                  if (result.paymentId) {
                    window.location.href = `/payments/status/${result.paymentId}`;
                  }
                }}
              />

              {/* Info Card */}
              <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white">
                <CardHeader>
                  <CardTitle>Quick Reference</CardTitle>
                  <CardDescription className="text-blue-100">
                    Common payment scenarios
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-white/10 rounded-xl backdrop-blur-sm">
                    <h3 className="font-medium mb-1">Referral Fee</h3>
                    <p className="text-sm text-blue-100 mb-2">
                      Standard referral processing fee
                    </p>
                    <p className="text-2xl font-bold">KES 200</p>
                  </div>
                  <div className="p-4 bg-white/10 rounded-xl backdrop-blur-sm">
                    <h3 className="font-medium mb-1">Consultation</h3>
                    <p className="text-sm text-blue-100 mb-2">
                      Specialist consultation fee
                    </p>
                    <p className="text-2xl font-bold">KES 500</p>
                  </div>
                  <div className="p-4 bg-white/10 rounded-xl backdrop-blur-sm">
                    <h3 className="font-medium mb-1">Emergency</h3>
                    <p className="text-sm text-blue-100 mb-2">
                      Emergency referral processing
                    </p>
                    <p className="text-2xl font-bold">KES 350</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="history">
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
                <CardDescription>View your recent transactions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Link
                    href="/payments/history"
                    className="text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-2"
                  >
                    View full payment history →
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function PaymentsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      }
    >
      <PaymentsContent />
    </Suspense>
  );
}
