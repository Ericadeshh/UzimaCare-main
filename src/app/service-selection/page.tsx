"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Send, Inbox, Hospital, ArrowRight } from "lucide-react";

export default function ServiceSelectionPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [selectedService, setSelectedService] = useState<
    "send" | "receive" | null
  >(null);

  // Redirect if not logged in or if user is patient
  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push("/login");
      } else if (user.role === "patient") {
        router.push("/dashboard/patient");
      }
    }
  }, [user, isLoading, router]);

  const handleContinue = () => {
    if (!selectedService) return;

    if (user?.role === "physician") {
      if (selectedService === "send") {
        router.push("/dashboard/send/physician");
      } else {
        router.push("/dashboard/receive/physician");
      }
    } else if (user?.role === "admin") {
      if (selectedService === "send") {
        router.push("/dashboard/send/admin");
      } else {
        router.push("/dashboard/receive/admin");
      }
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Get display name without Dr. prefix for admins
  const displayName =
    user.role === "physician" ? `Dr. ${user.name}` : user.name;

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl"
      >
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-linear-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg mb-4">
            <Hospital className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome, {displayName}
          </h1>
          <p className="text-gray-500 mt-2">
            How would you like to use UzimaCare today?
          </p>
          <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm">
            <span className="capitalize">{user.role}</span> • {user.email}
          </div>
        </div>

        {/* Service Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Send Referrals Card */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedService("send")}
            className={`cursor-pointer rounded-2xl p-8 transition-all ${
              selectedService === "send"
                ? "bg-linear-to-br from-blue-500 to-blue-600 text-white shadow-xl"
                : "bg-white hover:shadow-lg border-2 border-gray-100"
            }`}
          >
            <div
              className={`w-16 h-16 rounded-xl mb-4 flex items-center justify-center ${
                selectedService === "send" ? "bg-white/20" : "bg-blue-50"
              }`}
            >
              <Send
                className={`w-8 h-8 ${
                  selectedService === "send" ? "text-white" : "text-blue-500"
                }`}
              />
            </div>
            <h2
              className={`text-2xl font-bold mb-2 ${
                selectedService === "send" ? "text-white" : "text-gray-800"
              }`}
            >
              Sending Facility
            </h2>
            <p
              className={`mb-4 ${
                selectedService === "send" ? "text-blue-50" : "text-gray-500"
              }`}
            >
              Create and send patient referrals to other healthcare facilities
            </p>
            <div className="flex items-center gap-2">
              <span
                className={`text-sm font-medium ${
                  selectedService === "send" ? "text-white" : "text-blue-500"
                }`}
              >
                Create new referrals
              </span>
              <ArrowRight
                className={`w-4 h-4 ${
                  selectedService === "send" ? "text-white" : "text-blue-500"
                }`}
              />
            </div>
          </motion.div>

          {/* Receive Referrals Card */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedService("receive")}
            className={`cursor-pointer rounded-2xl p-8 transition-all ${
              selectedService === "receive"
                ? "bg-linear-to-br from-green-500 to-green-600 text-white shadow-xl"
                : "bg-white hover:shadow-lg border-2 border-gray-100"
            }`}
          >
            <div
              className={`w-16 h-16 rounded-xl mb-4 flex items-center justify-center ${
                selectedService === "receive" ? "bg-white/20" : "bg-green-50"
              }`}
            >
              <Inbox
                className={`w-8 h-8 ${
                  selectedService === "receive"
                    ? "text-white"
                    : "text-green-500"
                }`}
              />
            </div>
            <h2
              className={`text-2xl font-bold mb-2 ${
                selectedService === "receive" ? "text-white" : "text-gray-800"
              }`}
            >
              Receiving Facility
            </h2>
            <p
              className={`mb-4 ${
                selectedService === "receive"
                  ? "text-green-50"
                  : "text-gray-500"
              }`}
            >
              Manage and process incoming referrals to your facility
            </p>
            <div className="flex items-center gap-2">
              <span
                className={`text-sm font-medium ${
                  selectedService === "receive"
                    ? "text-white"
                    : "text-green-500"
                }`}
              >
                View incoming referrals
              </span>
              <ArrowRight
                className={`w-4 h-4 ${
                  selectedService === "receive"
                    ? "text-white"
                    : "text-green-500"
                }`}
              />
            </div>
          </motion.div>
        </div>

        {/* Continue Button */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: selectedService ? 1 : 0.5 }}
          onClick={handleContinue}
          disabled={!selectedService}
          className="w-full py-4 px-6 bg-linear-to-r from-gray-800 to-gray-900 text-white rounded-xl font-medium
                   disabled:opacity-50 disabled:cursor-not-allowed hover:from-gray-900 hover:to-black
                   transition-all transform hover:scale-[1.02] shadow-lg flex items-center justify-center gap-2"
        >
          Continue to Dashboard
          <ArrowRight className="w-5 h-5" />
        </motion.button>

        {/* Back to Login */}
        <div className="text-center mt-6">
          <button
            onClick={() => router.push("/login")}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            ← Not you? Sign in again
          </button>
        </div>
      </motion.div>
    </div>
  );
}
