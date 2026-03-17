"use client";

import React, { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  ArrowLeft,
  RefreshCw,
  FileText,
  Calendar,
  Phone,
  User,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSearchParams } from "next/navigation";

interface PaymentStatusPageProps {
  paymentId: string;
  onBack: () => void;
  onRetry: () => void;
  onViewDetails: () => void;
}

export default function PaymentStatusPage({
  paymentId,
  onBack,
  onRetry,
  onViewDetails,
}: PaymentStatusPageProps) {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get("status");
  const [checking, setChecking] = useState(true);
  const [pollAttempts, setPollAttempts] = useState(0);

  // Fetch payment details
  const payment = useQuery(api.payments.getPayment, {
    paymentId: paymentId as Id<"payments">,
  });

  // Fetch referral details if available
  const referral = useQuery(
    api.referrals.queries.getReferralById,
    payment?.referralId ? { referralId: payment.referralId } : "skip",
  );

  useEffect(() => {
    if (payment) {
      setChecking(false);
    }
  }, [payment]);

  // Poll for updates if payment is still pending
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (payment?.status === "pending" && pollAttempts < 20) {
      interval = setInterval(() => {
        setPollAttempts((prev) => prev + 1);
        // The useQuery will automatically refetch
      }, 3000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [payment?.status, pollAttempts]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString("en-KE", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusConfig = () => {
    const status = payment?.status || initialStatus || "pending";

    switch (status) {
      case "completed":
        return {
          icon: CheckCircle2,
          color: "text-green-600",
          bgColor: "bg-green-100",
          title: "Payment Successful!",
          message: "Your payment has been processed successfully.",
        };
      case "failed":
        return {
          icon: XCircle,
          color: "text-red-600",
          bgColor: "bg-red-100",
          title: "Payment Failed",
          message:
            payment?.failureReason ||
            "We couldn't process your payment. Please try again.",
        };
      case "pending":
      default:
        return {
          icon: Clock,
          color: "text-yellow-600",
          bgColor: "bg-yellow-100",
          title: "Payment Processing",
          message:
            "Your payment is being processed. This may take a few moments.",
        };
    }
  };

  const config = getStatusConfig();
  const StatusIcon = config.icon;

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Checking payment status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <Button
          onClick={onBack}
          variant="ghost"
          className="mb-6 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Status Card */}
          <Card className="border-0 shadow-xl overflow-hidden mb-6">
            <div className={`h-2 ${config.bgColor}`} />
            <CardHeader className="text-center pb-0">
              <div
                className={`w-20 h-20 rounded-full ${config.bgColor} mx-auto mb-4 flex items-center justify-center`}
              >
                <StatusIcon className={`w-10 h-10 ${config.color}`} />
              </div>
              <CardTitle className="text-2xl font-bold">
                {config.title}
              </CardTitle>
              <p className="text-gray-600 mt-2">{config.message}</p>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              {/* Payment Details */}
              {payment && (
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                    <span className="text-sm text-gray-600">Amount</span>
                    <span className="text-xl font-bold text-blue-600">
                      KES {payment.amount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Reference</span>
                    <span className="text-sm font-mono">
                      {payment.reference ||
                        payment.checkoutRequestId?.slice(-8) ||
                        "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Phone</span>
                    <span className="text-sm">{payment.phoneNumber}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Date</span>
                    <span className="text-sm">
                      {formatDate(payment.createdAt)}
                    </span>
                  </div>
                  {payment.mpesaReceiptNumber && (
                    <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                      <span className="text-sm text-gray-600">
                        M-Pesa Receipt
                      </span>
                      <span className="text-sm font-medium text-green-600">
                        {payment.mpesaReceiptNumber}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Referral Details */}
              {referral && (
                <div className="bg-blue-50 rounded-xl p-4 space-y-3">
                  <h3 className="font-medium text-blue-900 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Referral Details
                  </h3>
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-blue-600" />
                    <span className="text-gray-700">
                      Patient: {referral.patientName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span className="text-gray-700">
                      Created:{" "}
                      {new Date(referral.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CreditCard className="w-4 h-4 text-blue-600" />
                    <span className="text-gray-700">
                      Status:{" "}
                      <span className="capitalize">{referral.status}</span>
                    </span>
                  </div>
                  {referral.referredToFacility && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-700">
                        Facility: {referral.referredToFacility}
                      </span>
                    </div>
                  )}
                  <Button
                    onClick={onViewDetails}
                    variant="link"
                    className="text-blue-600 p-0 h-auto mt-2"
                  >
                    View Referral Details →
                  </Button>
                </div>
              )}

              {/* Polling Status for Pending Payments */}
              {payment?.status === "pending" && pollAttempts > 5 && (
                <div className="bg-yellow-50 rounded-xl p-4 text-center">
                  <p className="text-sm text-yellow-800">
                    Payment is taking longer than expected. You can keep this
                    window open or check back later.
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                {payment?.status === "failed" && (
                  <Button
                    onClick={onRetry}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                  </Button>
                )}
                {payment?.status === "pending" && (
                  <Button
                    onClick={() => window.location.reload()}
                    variant="outline"
                    className="flex-1"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Check Again
                  </Button>
                )}
                <Button
                  onClick={onBack}
                  variant={
                    payment?.status === "completed" ? "outline" : "ghost"
                  }
                  className="flex-1"
                >
                  Return to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Help Text */}
          <div className="text-center text-sm text-gray-500">
            <p>
              Having issues? Contact support at{" "}
              <a
                href="mailto:support@uzimacare.com"
                className="text-blue-600 hover:underline"
              >
                support@uzimacare.com
              </a>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
