"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import AdminDashboard from "@/components/admin/AdminDashboard";

export default function SendAdminPage() {
  const { user, isLoading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push("/login");
      } else if (user.role !== "admin") {
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

  if (!user || user.role !== "admin") {
    return null;
  }

  const adminUser = {
    id: user._id,
    fullName: user.name,
    email: user.email,
    role: user.role,
  };

  return <AdminDashboard user={adminUser} onLogout={signOut} />;
}
