"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Phone,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CreditCard,
  Smartphone,
  Shield,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { REFERRAL_FEE } from "@/lib/mpesa-config";
import { sendSTKPaymentPrompt } from "@/lib/payment";
import { formatPhoneNumber } from "@/lib/mpesa/utils";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface ReferralPaymentStepProps {
  referralId: string;
  referralNumber: string;
  patientName: string;
  physicianId: string;
  physicianName: string;
  onBack: () => void;
  onComplete: (paymentId: string) => void;
  token: string;
}

type PaymentStatus = "idle" | "processing" | "success" | "error";

// ============================================================================
// PAYMENT STEP COMPONENT
// ============================================================================

export default function ReferralPaymentStep({
  referralId,
  referralNumber,
  patientName,
  physicianId,
  physicianName,
  onBack,
  onComplete,
  token,
}: ReferralPaymentStepProps) {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [status, setStatus] = useState<PaymentStatus>("idle");
  const [message, setMessage] = useState("");
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  // Handle countdown for redirect
  useEffect(() => {
    if (status === "success" && paymentId && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }

    if (status === "success" && paymentId && countdown === 0) {
      onComplete(paymentId);
      router.push(`/payments/status/${paymentId}`);
    }
  }, [status, paymentId, countdown, onComplete, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate phone number
    let formattedPhone = phoneNumber.trim();
    formattedPhone = formattedPhone.replace(/\D/g, "");

    if (formattedPhone.length < 10) {
      setStatus("error");
      setMessage(
        "Please enter a valid Safaricom phone number starting with 07...",
      );
      return;
    }

    setStatus("processing");
    setMessage("Initiating payment...");

    try {
      console.log("💰 Initiating payment for referral:", referralId);

      const result = await sendSTKPaymentPrompt(
        referralId,
        phoneNumber,
        REFERRAL_FEE,
        physicianId,
      );

      if (result.success && result.paymentId) {
        setStatus("success");
        setPaymentId(result.paymentId);
        setMessage(result.message);
        setCountdown(5); // 5 second countdown before redirect
      } else {
        setStatus("error");
        setMessage(result.message || "Payment failed. Please try again.");
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      setStatus("error");
      setMessage(error.message || "An unexpected error occurred");
    }
  };

  const handleRetry = () => {
    setStatus("idle");
    setMessage("");
  };

  const handleViewStatus = () => {
    if (paymentId) {
      router.push(`/payments/status/${paymentId}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <CreditCard className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-800">Complete Payment</h2>
        <p className="text-sm text-gray-500 mt-1">
          Referral #{referralNumber} • Patient: {patientName}
        </p>
      </div>

      {/* Payment Info Card */}
      <Card className="bg-linear-to-r from-blue-50 to-indigo-50 border-blue-100 mb-4">
        <div className="p-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Referral Fee:</span>
            <span className="text-2xl font-bold text-blue-600">
              KES {REFERRAL_FEE}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
            <Shield className="w-3 h-3" />
            <span>Secure payment via M-Pesa</span>
          </div>
        </div>
      </Card>

      {/* Status Messages */}
      {status === "processing" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4"
        >
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
            <div>
              <p className="text-sm font-medium text-blue-800">{message}</p>
              <p className="text-xs text-blue-600 mt-1">
                Please check your phone and enter your M-Pesa PIN
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {status === "success" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4"
        >
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-800">{message}</p>
              <p className="text-xs text-green-600 mt-1">
                Redirecting to payment status in {countdown} seconds...
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {status === "error" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4"
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <div>
              <p className="text-sm font-medium text-red-800">{message}</p>
              <p className="text-xs text-red-600 mt-1">
                Please try again or use a different phone number
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Payment Form */}
      {status === "idle" && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="phone" className="block text-sm font-medium mb-2">
              <Phone className="w-4 h-4 inline mr-2 text-blue-500" />
              M-Pesa Phone Number
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="e.g., 0712345678"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
            <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
              <Smartphone className="w-3 h-3" />
              Enter the Safaricom number where you'll receive the STK push
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
            <p className="flex items-center gap-1 mb-1">
              <Clock className="w-3 h-3" />
              You'll receive a prompt on your phone within 30 seconds
            </p>
            <p>
              Enter your M-Pesa PIN to authorize payment of KES {REFERRAL_FEE}
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={onBack}
              variant="outline"
              className="flex-1"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              disabled={!phoneNumber}
            >
              Pay KES {REFERRAL_FEE}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </form>
      )}

      {/* Success Actions */}
      {status === "success" && (
        <div className="flex gap-3 pt-4">
          <Button
            onClick={handleViewStatus}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
          >
            View Payment Status Now
          </Button>
        </div>
      )}

      {/* Error Actions */}
      {status === "error" && (
        <div className="flex gap-3 pt-4">
          <Button
            onClick={handleRetry}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          >
            Try Again
          </Button>
          <Button onClick={onBack} variant="outline" className="flex-1">
            Go Back
          </Button>
        </div>
      )}
    </motion.div>
  );
}
