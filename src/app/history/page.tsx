"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import PhysicianPaymentHistory from "@/components/physician/PhysicianPaymentHistory";

export default function PaymentHistoryPage() {
  const { user, isLoading, token } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push("/login");
      } else if (user.role !== "physician") {
        // Only physicians can access this page for now
        // Admin will have their own payment history page in Step 7
        router.push("/dashboard/send/physician");
      }
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user || user.role !== "physician") {
    return null;
  }

  return (
    <PhysicianPaymentHistory
      userId={user._id}
      token={token || ""}
      onBack={() => router.push("/dashboard/send/physician")}
    />
  );
}
