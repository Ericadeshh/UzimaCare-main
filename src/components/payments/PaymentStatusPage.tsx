"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowLeft,
  Calendar,
  User,
  Building2,
  Phone,
  Clock,
  FileText,
  AlertCircle,
  RefreshCw,
  Home,
  Receipt,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatPhoneNumber } from "@/lib/mpesa/utils";
import { usePaymentStatus } from "@/hooks/usePaymentStatus";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface PaymentStatusPageProps {
  paymentId: string;
  onBack?: () => void;
  onRetry?: () => void;
  onViewDetails?: () => void;
}

interface ReferralDetails {
  patientName: string;
  patientAge?: number;
  patientGender?: string;
  referringHospital: string;
  referredToFacility: string;
  urgency: string;
  createdAt: string;
  referralNumber?: string;
}

// ============================================================================
// LOADING SKELETON COMPONENT
// ============================================================================

const PaymentStatusSkeleton = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <Card className="max-w-md w-full p-8">
      <div className="text-center">
        <div className="w-20 h-20 bg-blue-100 rounded-full mx-auto mb-4 animate-pulse" />
        <div className="h-8 bg-gray-200 rounded w-48 mx-auto mb-2 animate-pulse" />
        <div className="h-4 bg-gray-200 rounded w-64 mx-auto mb-6 animate-pulse" />

        <div className="space-y-3 mb-6">
          <div className="h-12 bg-gray-100 rounded-lg animate-pulse" />
          <div className="h-12 bg-gray-100 rounded-lg animate-pulse" />
          <div className="h-12 bg-gray-100 rounded-lg animate-pulse" />
        </div>

        <div className="h-10 bg-gray-200 rounded-lg animate-pulse" />
      </div>
    </Card>
  </div>
);

// ============================================================================
// SUCCESS STATE COMPONENT
// ============================================================================

const PaymentSuccess = ({
  payment,
  referral,
  onViewDetails,
  onBack,
}: {
  payment: any;
  referral: ReferralDetails | null;
  onViewDetails?: () => void;
  onBack?: () => void;
}) => {
  const router = useRouter();

  // Format currency
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Format date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString("en-KE", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 p-4"
    >
      <div className="max-w-md mx-auto">
        {/* Success Animation */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="text-center mb-6"
        >
          <div className="w-24 h-24 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-1">
            Payment Successful! 🎉
          </h1>
          <p className="text-gray-600">
            Your referral has been submitted and payment is confirmed
          </p>
        </motion.div>

        {/* Payment Details Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="overflow-hidden border-0 shadow-xl mb-4">
            {/* Amount Banner */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4 text-white">
              <p className="text-sm opacity-90 mb-1">Amount Paid</p>
              <p className="text-3xl font-bold">
                {formatAmount(payment.amount)}
              </p>
              {payment.mpesaReceiptNumber && (
                <p className="text-xs opacity-75 mt-1 font-mono">
                  Receipt: {payment.mpesaReceiptNumber}
                </p>
              )}
            </div>

            {/* Transaction Details */}
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <Receipt className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">Transaction ID:</span>
                <span className="font-mono text-gray-800 ml-auto">
                  {payment.transactionId?.slice(-8) || "N/A"}
                </span>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">Phone Number:</span>
                <span className="font-mono text-gray-800 ml-auto">
                  {formatPhoneNumber(payment.phoneNumber)}
                </span>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">Paid On:</span>
                <span className="text-gray-800 ml-auto">
                  {formatDate(payment.createdAt)}
                </span>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Referral Details Card */}
        {referral && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-0 shadow-xl mb-6 overflow-hidden">
              <div className="bg-blue-50 px-6 py-3 border-b border-blue-100">
                <h3 className="font-semibold text-blue-800 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Referral Details
                </h3>
              </div>

              <div className="p-6 space-y-4">
                {/* Patient Information */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Patient Name</p>
                    <p className="font-medium text-gray-800">
                      {referral.patientName}
                    </p>
                    {referral.patientAge && referral.patientGender && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        {referral.patientAge} yrs • {referral.patientGender}
                      </p>
                    )}
                  </div>
                </div>

                {/* Facility Transfer */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <div className="grid grid-cols-[1fr,auto,1fr] items-center gap-2">
                      <div>
                        <p className="text-xs text-gray-500">From</p>
                        <p className="text-sm font-medium text-gray-800">
                          {referral.referringHospital}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">To</p>
                        <p className="text-sm font-medium text-gray-800">
                          {referral.referredToFacility}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Urgency Badge */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Urgency</p>
                    <span
                      className={`
                      inline-block px-2 py-1 text-xs font-medium rounded-full
                      ${
                        referral.urgency === "emergency"
                          ? "bg-red-100 text-red-700"
                          : referral.urgency === "urgent"
                            ? "bg-orange-100 text-orange-700"
                            : "bg-blue-100 text-blue-700"
                      }
                    `}
                    >
                      {referral.urgency.charAt(0).toUpperCase() +
                        referral.urgency.slice(1)}
                    </span>
                  </div>
                </div>

                {/* Referral Number */}
                {referral.referralNumber && (
                  <div className="pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">
                      Referral Number
                    </p>
                    <p className="text-sm font-mono text-gray-800 bg-gray-50 px-3 py-2 rounded-lg">
                      {referral.referralNumber}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col gap-3"
        >
          {onViewDetails && (
            <Button
              onClick={onViewDetails}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12"
            >
              View Full Referral Details
            </Button>
          )}

          <Button
            onClick={() => router.push("/dashboard/send/physician")}
            variant="outline"
            className="w-full h-12"
          >
            <Home className="w-4 h-4 mr-2" />
            Return to Dashboard
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
};

// ============================================================================
// FAILURE STATE COMPONENT
// ============================================================================

const PaymentFailure = ({
  payment,
  error,
  onRetry,
  onBack,
}: {
  payment?: any;
  error?: string;
  onRetry?: () => void;
  onBack?: () => void;
}) => {
  const router = useRouter();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-gradient-to-br from-red-50 to-rose-50 p-4"
    >
      <div className="max-w-md mx-auto">
        {/* Failure Animation */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="text-center mb-6"
        >
          <div className="w-24 h-24 bg-red-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <XCircle className="w-12 h-12 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-1">
            Payment Failed
          </h1>
          <p className="text-gray-600">
            {error || "We couldn't process your payment. Please try again."}
          </p>
        </motion.div>

        {/* Error Details Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-0 shadow-xl mb-6 overflow-hidden">
            <div className="bg-red-50 px-6 py-4 border-b border-red-100">
              <h3 className="font-semibold text-red-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                What went wrong?
              </h3>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-red-50 rounded-lg p-4">
                <p className="text-sm text-red-700">
                  {error ||
                    "The transaction was cancelled or declined. This could be due to:"}
                </p>
                <ul className="text-sm text-red-600 mt-2 list-disc list-inside">
                  <li>Insufficient M-Pesa balance</li>
                  <li>Transaction cancelled by user</li>
                  <li>Network timeout</li>
                  <li>Invalid M-Pesa PIN</li>
                </ul>
              </div>

              {payment && (
                <div className="flex items-center gap-3 text-sm">
                  <Receipt className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">Amount attempted:</span>
                  <span className="font-semibold text-gray-800 ml-auto">
                    KES {payment.amount}
                  </span>
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col gap-3"
        >
          {onRetry && (
            <Button
              onClick={onRetry}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Payment Again
            </Button>
          )}

          <Button
            onClick={() => router.back()}
            variant="outline"
            className="w-full h-12"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
};

// ============================================================================
// PENDING STATE COMPONENT
// ============================================================================

const PaymentPending = ({
  payment,
  onCheckAgain,
}: {
  payment?: any;
  onCheckAgain: () => void;
}) => {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4"
    >
      <div className="max-w-md mx-auto">
        {/* Pending Animation */}
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="text-center mb-6"
        >
          <div className="w-24 h-24 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-1">
            Waiting for Payment
          </h1>
          <p className="text-gray-600">
            Please check your phone and enter your M-Pesa PIN
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Time elapsed: {seconds} seconds
          </p>
        </motion.div>

        {/* Instructions Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-0 shadow-xl mb-6">
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-bold">1</span>
                </div>
                <p className="text-sm text-gray-600">
                  Check your phone for an STK push from "MPESA"
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-bold">2</span>
                </div>
                <p className="text-sm text-gray-600">
                  Enter your M-Pesa PIN to authorize payment of KES{" "}
                  {payment?.amount}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-bold">3</span>
                </div>
                <p className="text-sm text-gray-600">
                  Wait for confirmation - this page will update automatically
                </p>
              </div>

              {payment?.phoneNumber && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-1">Sending to:</p>
                  <p className="text-sm font-mono text-gray-800">
                    {formatPhoneNumber(payment.phoneNumber)}
                  </p>
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Manual Check Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            onClick={onCheckAgain}
            variant="outline"
            className="w-full h-12"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Check Again
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
};

// ============================================================================
// MAIN PAYMENT STATUS PAGE COMPONENT
// ============================================================================

export default function PaymentStatusPage({
  paymentId,
  onBack,
  onRetry,
  onViewDetails,
}: PaymentStatusPageProps) {
  const { status, payment, referral, error, isLoading, refresh } =
    usePaymentStatus(paymentId);
  const router = useRouter();

  // Handle loading state
  if (isLoading) {
    return <PaymentStatusSkeleton />;
  }

  // Handle payment not found
  if (!payment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Payment Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            The payment you're looking for doesn't exist or has been removed.
          </p>
          <Button
            onClick={() => router.push("/dashboard/send/physician")}
            className="w-full"
          >
            Return to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  // Render based on payment status
  switch (status) {
    case "completed":
      return (
        <PaymentSuccess
          payment={payment}
          referral={referral}
          onViewDetails={onViewDetails}
          onBack={onBack}
        />
      );

    case "failed":
      return (
        <PaymentFailure
          payment={payment}
          error={error || payment.failureReason}
          onRetry={onRetry}
          onBack={onBack}
        />
      );

    case "pending":
      return <PaymentPending payment={payment} onCheckAgain={refresh} />;

    default:
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full p-8 text-center">
            <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              Unknown Status
            </h2>
            <p className="text-gray-600 mb-6">
              Unable to determine payment status. Please try again.
            </p>
            <Button onClick={refresh} className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Check Again
            </Button>
          </Card>
        </div>
      );
  }
}
