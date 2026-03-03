"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import PhysicianDashboard from "@/components/physician/PhysicianDashboard";

export default function SendPhysicianPage() {
  const { user, isLoading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push("/login");
      } else if (user.role !== "physician") {
        router.push("/login");
      }
      // No need to check intent anymore
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

  const physicianUser = {
    id: user._id,
    fullName: user.name,
    email: user.email,
    role: user.role,
    hospital: user.hospital || "General Hospital",
    specialization: user.specialization || "General Practice",
    phoneNumber: user.phoneNumber || "",
    licenseNumber: user.licenseNumber || "",
  };

  return <PhysicianDashboard user={physicianUser} onLogout={signOut} />;
}
