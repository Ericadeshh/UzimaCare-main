"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Id } from "@convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import PhysicianReceivingDashboard from "@/components/receiving-facility/physician/PhysicianReceivingDashboard";

interface FacilityData {
  _id: Id<"facilities">;
  name: string;
  type: string;
  departments: string[];
  bedCapacity?: number;
}

export default function ReceivePhysicianPage() {
  const { user, token, signOut, isLoading } = useAuth();
  const router = useRouter();
  const [facilityData, setFacilityData] = useState<FacilityData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Only run query if we have both hospital and token
  const facility = useQuery(
    api.receivingFacility.queries.getFacilityByName,
    user?.hospital && token ? { facilityName: user.hospital, token } : "skip",
  );

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push("/login");
        return;
      }

      if (user.role !== "physician") {
        router.push("/login");
        return;
      }

      // Check if user has hospital assigned
      if (!user.hospital) {
        setError(
          "No hospital assigned to your account. Please contact support.",
        );
        return;
      }

      // If query returned data, use it
      if (facility) {
        setFacilityData({
          _id: facility._id,
          name: facility.name,
          type: facility.type,
          departments: facility.departments || ["General"],
          bedCapacity: facility.bedCapacity || 100,
        });
      }
      // If query returned null (facility doesn't exist), use temporary data
      else if (facility === null && user.hospital) {
        setError(
          `Facility "${user.hospital}" not found. Using temporary data. Please contact your administrator.`,
        );

        // Use temporary data so page doesn't hang
        setFacilityData({
          _id: `temp-${Date.now()}` as Id<"facilities">,
          name: user.hospital,
          type: "hospital",
          departments: ["General"],
          bedCapacity: 100,
        });
      }
    }
  }, [user, isLoading, router, facility]);

  const handleLogout = async () => {
    await signOut();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <p className="ml-3 text-gray-600">Loading authentication...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md">
          <h2 className="text-xl font-bold text-red-700 mb-2">Error</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  if (!facilityData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <p className="ml-3 text-gray-600">
          {user?.hospital
            ? `Loading facility: ${user.hospital}...`
            : "Setting up your dashboard..."}
        </p>
      </div>
    );
  }

  return (
    <PhysicianReceivingDashboard
      user={user}
      facilityData={facilityData}
      onLogout={handleLogout}
    />
  );
}
