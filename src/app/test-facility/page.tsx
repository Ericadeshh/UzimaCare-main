"use client";

import { useAuth } from "@/context/AuthContext";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useEffect } from "react";

export default function TestFacilityPage() {
  const { user, token } = useAuth();

  // Try to query the facility directly
  const facilities = useQuery(api.facilities.queries.getActiveFacilities);

  const facilityByName = useQuery(
    api.receivingFacility.queries.getFacilityByName,
    user?.hospital && token ? { facilityName: user.hospital, token } : "skip",
  );

  useEffect(() => {
    console.log("Test Page - User:", user);
    console.log("Test Page - Token:", token);
    console.log("Test Page - All Facilities:", facilities);
    console.log("Test Page - Facility by Name:", facilityByName);
  }, [user, token, facilities, facilityByName]);

  if (!user) return <div>Loading user...</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Facility Test Page</h1>

      <div className="mb-6 p-4 bg-gray-100 rounded">
        <h2 className="font-semibold">User Info:</h2>
        <pre className="mt-2">{JSON.stringify(user, null, 2)}</pre>
      </div>

      <div className="mb-6 p-4 bg-gray-100 rounded">
        <h2 className="font-semibold">All Facilities:</h2>
        <pre className="mt-2">{JSON.stringify(facilities, null, 2)}</pre>
      </div>

      <div className="mb-6 p-4 bg-gray-100 rounded">
        <h2 className="font-semibold">Facility by Name ({user?.hospital}):</h2>
        <pre className="mt-2">{JSON.stringify(facilityByName, null, 2)}</pre>
      </div>
    </div>
  );
}
