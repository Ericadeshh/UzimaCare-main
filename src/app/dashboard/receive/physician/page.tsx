"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Id } from "@convex/_generated/dataModel";
import { useQuery, useMutation } from "convex/react";
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
  const [isFixing, setIsFixing] = useState(false);

  // Only run query if we have both hospital and token
  const facility = useQuery(
    api.receivingFacility.queries.getFacilityByName,
    user?.hospital && token ? { facilityName: user.hospital, token } : "skip",
  );

  // Helper mutation to create facility for existing users
  const createFacilityHelper = useMutation(
    api.receivingFacility.helpers.createFacilityForUser,
  );

  useEffect(() => {
    const fixMissingHospital = async () => {
      if (!user || !token || isFixing) return;

      setIsFixing(true);
      try {
        // If user has no hospital, create a default one
        if (!user.hospital) {
          const defaultHospital = `${user.name}'s Clinic`;

          // Create facility
          await createFacilityHelper({
            facilityName: defaultHospital,
            userEmail: user.email,
            userPhone: user.phoneNumber,
            userId: user._id,
          });

          // Show temporary data while we wait for refresh
          setFacilityData({
            _id: `temp-${Date.now()}` as Id<"facilities">,
            name: defaultHospital,
            type: "hospital",
            departments: ["General"],
            bedCapacity: 100,
          });

          // Show a message to the user
          setError(
            `Hospital "${defaultHospital}" was created for you. Please update your hospital details in settings.`,
          );
        }
      } catch (err) {
        console.error("Error fixing missing hospital:", err);
        setError("Could not set up your hospital. Please contact support.");
      } finally {
        setIsFixing(false);
      }
    };

    if (!isLoading) {
      if (!user) {
        router.push("/login");
        return;
      }

      if (user.role !== "physician") {
        router.push("/login");
        return;
      }

      // If user has no hospital, try to fix it
      if (!user.hospital) {
        fixMissingHospital();
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
      // If query returned null (facility doesn't exist), create it now
      else if (facility === null && user.hospital && !isFixing) {
        setIsFixing(true);
        createFacilityHelper({
          facilityName: user.hospital,
          userEmail: user.email,
          userPhone: user.phoneNumber,
          userId: user._id,
        })
          .then(() => {
            // Use temporary data and rely on next query
            setFacilityData({
              _id: `temp-${Date.now()}` as Id<"facilities">,
              name: user.hospital,
              type: "hospital",
              departments: ["General"],
              bedCapacity: 100,
            });
          })
          .catch((err) => {
            console.error("Failed to auto-create facility:", err);
            setError("Could not access facility data. Please contact support.");
          })
          .finally(() => {
            setIsFixing(false);
          });
      }
    }
  }, [
    user,
    isLoading,
    router,
    facility,
    createFacilityHelper,
    token,
    isFixing,
  ]);

  const handleLogout = async () => {
    await signOut();
  };

  if (isLoading || isFixing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <p className="ml-3 text-gray-600">
          {isFixing
            ? "Setting up your hospital..."
            : "Loading authentication..."}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 max-w-md">
          <h2 className="text-xl font-bold text-yellow-700 mb-2">Notice</h2>
          <p className="text-yellow-600 mb-4">{error}</p>
          {facilityData && (
            <div className="mt-4 p-3 bg-white rounded-lg">
              <p className="text-sm text-gray-600 mb-2">
                You can still access the dashboard with temporary data.
              </p>
              <button
                onClick={() => setError(null)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Continue to Dashboard
              </button>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
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
