"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Smartphone,
  Lock,
  Shield,
  Phone,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Wallet,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { usePayments } from "@/hooks/usePayments";
import { checkPaymentStatus } from "@/lib/payment";
import {
  validatePhoneNumber,
  validateAmount,
  formatCurrency,
} from "@/utils/validators";

// Full range of amount options (50-500)
const AMOUNT_OPTIONS = [50, 100, 150, 200, 250, 300, 350, 400, 450, 500];

interface MpesaPaymentProps {
  amount?: number;
  paymentType:
    | "booking"
    | "subscription"
    | "onboarding"
    | "referral_fee"
    | "wallet_topup";
  relatedEntityId?: string;
  relatedEntityType?: string;
  onSuccess?: (result: any) => void;
  onError?: (error: any) => void;
  description?: string;
  showAmountSelector?: boolean;
  referralId?: string;
  patientName?: string;
}

export function MpesaPayment({
  amount: presetAmount,
  paymentType,
  relatedEntityId,
  relatedEntityType,
  onSuccess,
  onError,
  description,
  showAmountSelector = true,
  referralId,
  patientName,
}: MpesaPaymentProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedAmount, setSelectedAmount] = useState(presetAmount || 200);
  const [customAmount, setCustomAmount] = useState("");
  const [useCustomAmount, setUseCustomAmount] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<
    "idle" | "processing" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");
  const [paymentId, setPaymentId] = useState<string | null>(null);

  const { makePayment } = usePayments();

  // Poll for payment status when processing
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

            // Redirect to status page
            setTimeout(() => {
              window.location.href = `/payments/status/${paymentId}`;
            }, 2000);
          } else if (paymentStatus.status === "failed") {
            setStatus("error");
            setMessage(
              paymentStatus.payment?.failureReason ||
                "Payment failed. Please try again.",
            );
            clearInterval(interval);
          }
        } catch (error) {
          console.error("Error polling payment status:", error);
        }
      }, 3000); // Poll every 3 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status, paymentId]);

  const getPaymentTypeLabel = () => {
    switch (paymentType) {
      case "referral_fee":
        return "Referral Fee";
      case "booking":
        return "Booking Payment";
      case "subscription":
        return "Subscription";
      case "onboarding":
        return "Onboarding Fee";
      case "wallet_topup":
        return "Wallet Top Up";
      default:
        return "Payment";
    }
  };

  const getFinalAmount = () => {
    if (useCustomAmount) {
      return parseInt(customAmount) || 0;
    }
    return selectedAmount;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const finalAmount = getFinalAmount();

    // Validate phone number
    if (!validatePhoneNumber(phoneNumber)) {
      setStatus("error");
      setMessage("Please enter a valid Safaricom number (e.g., 0712345678)");
      return;
    }

    // Validate amount
    if (!validateAmount(finalAmount)) {
      setStatus("error");
      setMessage("Amount must be between KES 10 and KES 150,000");
      return;
    }

    setIsProcessing(true);
    setStatus("processing");
    setMessage("Initiating secure payment...");

    try {
      const result = await makePayment(
        finalAmount,
        phoneNumber,
        referralId, // Pass referralId to link payment
        relatedEntityId, // Pass as userId or facilityId
      );

      if (result.success && result.paymentId) {
        setPaymentId(result.paymentId);
        setStatus("processing");
        setMessage(
          "STK push sent! Please check your phone and enter your PIN.",
        );
        onSuccess?.(result);
      } else {
        setStatus("error");
        setMessage(result.error || "Payment failed. Please try again.");
        onError?.(result.error);
      }
    } catch (error: any) {
      setStatus("error");
      setMessage(error.message || "An unexpected error occurred");
      onError?.(error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto"
    >
      <Card className="border-0 shadow-xl overflow-hidden bg-linear-to-b from-white to-blue-50/30">
        {/* Header with gradient */}
        <CardHeader className="bg-linear-to-r from-blue-600 to-indigo-600 text-white p-6">
          <div className="flex items-center justify-between mb-2">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              {getPaymentTypeLabel()}
            </CardTitle>
            <div className="bg-white/20 p-2 rounded-full">
              <Smartphone className="w-4 h-4" />
            </div>
          </div>
          {description && (
            <CardDescription className="text-blue-100 text-sm">
              {description}
            </CardDescription>
          )}
          {patientName && patientName.trim() !== "" ? (
            <div className="mt-2 text-sm text-blue-100 border-t border-blue-400/30 pt-2">
              Patient:{" "}
              <span className="font-medium text-white">{patientName}</span>
            </div>
          ) : referralId ? (
            <div className="mt-2 text-sm text-blue-100 border-t border-blue-400/30 pt-2">
              Referral ID:{" "}
              <span className="font-medium text-white">
                {referralId.slice(-8)}
              </span>
            </div>
          ) : null}
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Amount Display/Selector */}
          {showAmountSelector ? (
            <div className="space-y-4">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-500" />
                {presetAmount ? "Referral Fee" : "Select Amount (KES)"}
              </label>

              {/* If preset amount is provided, show it prominently */}
              {presetAmount ? (
                <div className="text-center p-4 bg-linear-to-r from-blue-50 to-indigo-50 rounded-xl">
                  <p className="text-3xl font-bold text-blue-600">
                    KES {presetAmount.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Fixed amount for referral payment
                  </p>
                </div>
              ) : (
                <>
                  {/* Amount Quick Select - Full Range 50-500 */}
                  <div className="grid grid-cols-5 gap-2">
                    {AMOUNT_OPTIONS.map((amt) => (
                      <motion.button
                        key={amt}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={() => {
                          setUseCustomAmount(false);
                          setSelectedAmount(amt);
                        }}
                        className={`p-2 text-sm rounded-lg transition-all ${
                          !useCustomAmount && selectedAmount === amt
                            ? "bg-linear-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-200"
                            : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
                        }`}
                      >
                        {amt}
                      </motion.button>
                    ))}
                  </div>

                  {/* Custom Amount Checkbox */}
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="customAmount"
                      checked={useCustomAmount}
                      onChange={(e) => setUseCustomAmount(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <Label
                      htmlFor="customAmount"
                      className="text-sm text-gray-600"
                    >
                      Enter custom amount
                    </Label>
                  </div>

                  {/* Custom Amount Input */}
                  {useCustomAmount && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <Input
                        type="number"
                        placeholder="Enter amount (KES)"
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                        min="10"
                        step="10"
                        className="border-gray-200 focus:border-blue-500"
                      />
                    </motion.div>
                  )}

                  {/* Display selected amount when not using custom */}
                  {!useCustomAmount && (
                    <div className="text-center p-3 bg-linear-to-r from-blue-50 to-indigo-50 rounded-xl">
                      <p className="text-sm text-gray-600">Amount to Pay</p>
                      <p className="text-2xl font-bold text-blue-600">
                        KES {selectedAmount}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="text-center p-4 bg-linear-to-r from-blue-50 to-indigo-50 rounded-xl">
              <p className="text-sm text-gray-600 mb-1">Amount to Pay</p>
              <p className="text-3xl font-bold text-blue-600">
                {formatCurrency(presetAmount || selectedAmount)}
              </p>
            </div>
          )}

          {/* Phone Number Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Phone className="w-4 h-4 text-blue-500" />
              M-Pesa Phone Number
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <span className="text-sm text-gray-500">+254</span>
              </div>
              <Input
                type="tel"
                placeholder="712345678"
                value={phoneNumber.replace("254", "")}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "");
                  setPhoneNumber(value ? `254${value}` : "");
                }}
                disabled={isProcessing}
                className="pl-14 h-12 text-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Shield className="w-3 h-3" />
              Your number is secure and encrypted
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
                className={`p-4 rounded-xl flex items-start gap-3 ${
                  status === "success"
                    ? "bg-green-50 border border-green-200"
                    : status === "error"
                      ? "bg-red-50 border border-red-200"
                      : "bg-blue-50 border border-blue-200"
                }`}
              >
                {status === "success" && (
                  <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                )}
                {status === "error" && (
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                )}
                {status === "processing" && (
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin shrink-0 mt-0.5" />
                )}
                <div>
                  <p
                    className={`text-sm font-medium ${
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
                      Please check your phone for the STK push prompt
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Security Badge */}
          <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Lock className="w-3 h-3" />
              <span>Secured by Safaricom</span>
            </div>
            <div className="flex items-center gap-1">
              <Shield className="w-3 h-3" />
              <span>256-bit SSL</span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="p-6 pt-0">
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={
              isProcessing ||
              !phoneNumber ||
              (useCustomAmount ? !customAmount : false)
            }
            className="w-full h-12 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-xl shadow-lg shadow-blue-200 transition-all disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Pay {formatCurrency(getFinalAmount())}
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* Trust Badge */}
      <div className="mt-4 text-center">
        <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
          <Sparkles className="w-3 h-3" />
          Powered by M-Pesa • Instant confirmation • No hidden fees
        </p>
      </div>
    </motion.div>
  );
}
