"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Smartphone,
  Shield,
  Phone,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Wallet,
  ArrowRight,
  X,
  Lock,
  Sparkles,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { usePayments } from "@/hooks/usePayments";
import { checkPaymentStatus } from "@/lib/payment";
import { REFERRAL_FEE } from "@/lib/mpesa-config";

interface AdminMpesaPaymentProps {
  referral: any;
  onSuccess: (paymentId: string) => void;
  onFailure: () => void;
  onClose: () => void;
}

export default function AdminMpesaPayment({
  referral,
  onSuccess,
  onFailure,
  onClose,
}: AdminMpesaPaymentProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [rawPhoneNumber, setRawPhoneNumber] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<
    "idle" | "processing" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");
  const [paymentId, setPaymentId] = useState<string | null>(null);

  const { makePayment } = usePayments();

  // Poll for payment status
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (status === "processing" && paymentId) {
      interval = setInterval(async () => {
        try {
          console.log(`🔄 Polling payment status for: ${paymentId}`);
          const paymentStatus = await checkPaymentStatus(paymentId);

          if (paymentStatus.status === "completed") {
            setStatus("success");
            setMessage("Payment completed successfully!");
            clearInterval(interval);

            // Notify parent component after 2 seconds
            setTimeout(() => {
              onSuccess(paymentId);
            }, 2000);
          } else if (paymentStatus.status === "failed") {
            setStatus("error");
            setMessage(
              paymentStatus.payment?.failureReason || "Payment failed",
            );
            clearInterval(interval);
          }
        } catch (error) {
          console.error("Error polling payment status:", error);
        }
      }, 3000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status, paymentId, onSuccess]);

  // Format phone number as user types (accept 07xxx format)
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, ""); // Remove all non-digits

    // Store raw digits for validation
    setRawPhoneNumber(value);

    // Limit to 10 digits (07XXXXXXXX)
    if (value.length > 10) {
      value = value.slice(0, 10);
    }

    // Format as 07XX XXX XXX while typing for better UX
    let formattedValue = value;
    if (value.length > 0) {
      if (value.length <= 3) {
        formattedValue = value;
      } else if (value.length <= 6) {
        formattedValue = `${value.slice(0, 3)} ${value.slice(3)}`;
      } else {
        formattedValue = `${value.slice(0, 3)} ${value.slice(3, 6)} ${value.slice(6, 10)}`;
      }
    }

    setPhoneNumber(formattedValue);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Extract digits and validate
    const digits = rawPhoneNumber || phoneNumber.replace(/\D/g, "");

    // Validate Kenyan phone number (starts with 07 and has 10 digits)
    if (!digits.startsWith("07") || digits.length !== 10) {
      setStatus("error");
      setMessage(
        "Please enter a valid Safaricom number starting with 07 (e.g., 0712 345 678)",
      );
      return;
    }

    setIsProcessing(true);
    setStatus("processing");
    setMessage("Initiating secure payment...");

    try {
      // Convert to international format for M-Pesa API (2547XXXXXXXX)
      const internationalNumber = "254" + digits.slice(1);

      console.log("💰 Initiating payment:", {
        amount: REFERRAL_FEE,
        phone: internationalNumber,
        referralId: referral._id,
        physicianId: referral.referringPhysicianId,
      });

      const result = await makePayment(
        REFERRAL_FEE,
        internationalNumber,
        referral._id,
        referral.referringPhysicianId,
      );

      if (result.success && result.paymentId) {
        setPaymentId(result.paymentId);
        setStatus("processing");
        setMessage(
          "STK push sent! Please ask patient to check their phone and enter PIN.",
        );
      } else {
        setStatus("error");
        setMessage(result.error || "Payment failed. Please try again.");
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      setStatus("error");
      setMessage(error.message || "An unexpected error occurred");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Safaricom Green Theme */}
        <div className="bg-linear-to-r from-green-600 to-green-700 p-4 sm:p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-full">
                <Smartphone className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold">M-Pesa Payment</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/20 rounded-full transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
          <p className="text-green-100 text-xs sm:text-sm">
            Referral #{referral.referralNumber} • Patient:{" "}
            {referral.patientName}
          </p>
        </div>

        <div className="p-4 sm:p-6">
          {/* Amount Display */}
          <div className="text-center mb-4 sm:mb-6">
            <p className="text-xs sm:text-sm text-gray-500 mb-1">
              Referral Fee
            </p>
            <p className="text-3xl sm:text-4xl font-bold text-gray-800">
              KES {REFERRAL_FEE}
            </p>
          </div>

          {/* Status Messages */}
          <AnimatePresence mode="wait">
            {status !== "idle" && (
              <motion.div
                key={status}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className={`mb-4 sm:mb-6 p-3 sm:p-4 rounded-xl flex items-start gap-3 ${
                  status === "success"
                    ? "bg-green-50 border border-green-200"
                    : status === "error"
                      ? "bg-red-50 border border-red-200"
                      : "bg-blue-50 border border-blue-200"
                }`}
              >
                {status === "success" && (
                  <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                )}
                {status === "error" && (
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                )}
                {status === "processing" && (
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin shrink-0" />
                )}
                <div className="flex-1">
                  <p
                    className={`text-xs sm:text-sm font-medium ${
                      status === "success"
                        ? "text-green-800"
                        : status === "error"
                          ? "text-red-800"
                          : "text-blue-800"
                    }`}
                  >
                    {message}
                  </p>
                  {status === "processing" && (
                    <p className="text-xs text-blue-600 mt-1">
                      Waiting for patient to enter PIN...
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Phone Number Input */}
          {status === "idle" && (
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Patient's M-Pesa Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    type="tel"
                    placeholder="07XXXXXXXX"
                    value={phoneNumber}
                    onChange={handlePhoneChange}
                    className="pl-10 h-12 sm:h-14 text-base sm:text-lg border-gray-300 focus:border-green-500 focus:ring-green-500"
                    autoFocus
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  Enter number in 07XX format (e.g., 0712345678)
                </p>
              </div>

              <div className="bg-gray-50 p-3 sm:p-4 rounded-xl">
                <h3 className="font-medium text-gray-700 mb-2 flex items-center gap-2 text-sm sm:text-base">
                  <Wallet className="w-4 h-4 text-green-600" />
                  Payment Summary
                </h3>
                <div className="space-y-2 text-xs sm:text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Referral Fee:</span>
                    <span className="font-medium">KES {REFERRAL_FEE}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Patient:</span>
                    <span className="font-medium">{referral.patientName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Facility:</span>
                    <span className="font-medium">
                      {referral.referredToFacility}
                    </span>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isProcessing || !phoneNumber}
                className="w-full h-12 sm:h-14 bg-linear-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium rounded-xl shadow-lg shadow-green-200 transition-all disabled:opacity-50 text-sm sm:text-base"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Send STK Push to Patient
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>
          )}

          {/* Success State Actions */}
          {status === "success" && (
            <Button
              onClick={() => onSuccess(paymentId!)}
              className="w-full h-12 sm:h-14 bg-green-600 hover:bg-green-700 text-white text-sm sm:text-base"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Continue to Approved Referrals
            </Button>
          )}

          {/* Error State Actions */}
          {status === "error" && (
            <div className="space-y-3">
              <Button
                onClick={() => {
                  setStatus("idle");
                  setMessage("");
                }}
                className="w-full h-12 sm:h-14 bg-green-600 hover:bg-green-700 text-white text-sm sm:text-base"
              >
                Try Again
              </Button>
              <Button
                onClick={onFailure}
                variant="outline"
                className="w-full h-12 sm:h-14 text-sm sm:text-base"
              >
                Cancel
              </Button>
            </div>
          )}

          {/* Security Badge */}
          <div className="mt-4 sm:mt-6 flex items-center justify-center gap-4 text-xs text-gray-400">
            <div className="flex items-center gap-1">
              <Lock className="w-3 h-3" />
              <span>256-bit SSL</span>
            </div>
            <div className="flex items-center gap-1">
              <Shield className="w-3 h-3" />
              <span>Secured by Safaricom</span>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
