"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  User,
  Building2,
  Calendar,
  Activity,
  AlertCircle,
  Eye,
  Search,
  Smartphone,
  CheckCircle,
  XCircle,
  Loader2,
  ArrowLeft,
  Phone,
  Stethoscope,
  Hospital,
  MapPin,
  ChevronRight,
  Award,
} from "lucide-react";
import { format } from "date-fns";
import AdminMpesaPayment from "./AdminMpesaPayment";

interface Referral {
  _id: Id<"referrals">;
  referralNumber: string;
  patientName: string;
  patientAge: number;
  patientGender: string;
  patientContact: string;
  referringPhysicianId: Id<"users">;
  referringPhysicianName: string;
  referringHospital: string;
  diagnosis: string;
  clinicalSummary: string;
  reasonForReferral: string;
  urgency: "routine" | "urgent" | "emergency";
  referredToFacility: string;
  referredToDepartment?: string;
  referredToPhysician?: string;
  status:
    | "pending"
    | "approved"
    | "forwarded"
    | "completed"
    | "rejected"
    | "cancelled";
  submittedAt: string;
  physicianNotes?: string;
}

interface PhysicianProfile {
  _id: Id<"users">;
  name: string;
  email: string;
  phoneNumber?: string;
  hospital?: string;
  licenseNumber?: string | null;
  specialization?: string | null;
  qualifications?: string[];
  yearsOfExperience?: number;
}

export default function PendingPhysicianReferrals() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedReferral, setSelectedReferral] = useState<Referral | null>(
    null,
  );
  const [physicianProfile, setPhysicianProfile] =
    useState<PhysicianProfile | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState("");
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const { token } = useAuth();

  // Queries
  const pendingReferrals = useQuery(
    api.referrals.queries.getPendingReferralsAdmin,
    {
      adminToken: token || "",
    },
  );

  // Fetch physician profile when a referral is selected
  const physicianProfileQuery = useQuery(
    api.physicians.queries.getPhysicianProfile,
    selectedReferral
      ? { physicianId: selectedReferral.referringPhysicianId }
      : "skip",
  );

  // Update physician profile when query returns
  useEffect(() => {
    if (physicianProfileQuery) {
      setPhysicianProfile(physicianProfileQuery);
      setIsLoadingProfile(false);
    }
  }, [physicianProfileQuery]);

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "emergency":
        return "text-red-600 bg-red-50 border-red-200";
      case "urgent":
        return "text-orange-600 bg-orange-50 border-orange-200";
      default:
        return "text-blue-600 bg-blue-50 border-blue-200";
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case "emergency":
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
            Emergency
          </span>
        );
      case "urgent":
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-700">
            Urgent
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
            Routine
          </span>
        );
    }
  };

  const filteredReferrals = pendingReferrals?.filter((referral: Referral) => {
    return (
      referral.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      referral.referralNumber
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      referral.referringPhysicianName
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
  });

  // Handler for the main list button - opens payment modal directly
  const handleApproveFromList = (referral: Referral) => {
    setSelectedReferral(referral);
    setShowPaymentModal(true);
  };

  // Handler for the view button - shows details with physician license
  const handleViewDetails = (referral: Referral) => {
    setSelectedReferral(referral);
    setIsLoadingProfile(true);
    setShowDetails(true);
  };

  // Handler for the approve button inside details view
  const handleApproveFromDetails = () => {
    if (selectedReferral) {
      setShowPaymentModal(true);
    }
  };

  const handlePaymentSuccess = (paymentId: string) => {
    console.log("Payment successful:", paymentId);
    setShowPaymentModal(false);
    setShowDetails(false);
    setSelectedReferral(null);
    setPhysicianProfile(null);
    setApprovalNotes("");
  };

  const handlePaymentFailure = () => {
    setShowPaymentModal(false);
  };

  const handleBackToList = () => {
    setShowDetails(false);
    setSelectedReferral(null);
    setPhysicianProfile(null);
    setApprovalNotes("");
  };

  // Detail View
  if (showDetails && selectedReferral) {
    return (
      <div className="space-y-4 sm:space-y-6">
        {/* Back Button - Responsive */}
        <Button
          onClick={handleBackToList}
          variant="outline"
          className="flex items-center gap-2 w-full sm:w-auto text-sm sm:text-base"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to List
        </Button>

        <Card className="p-4 sm:p-6 overflow-hidden">
          <div className="space-y-4 sm:space-y-6">
            {/* Header - Responsive */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
              <div>
                <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
                    #{selectedReferral.referralNumber}
                  </h2>
                  {getUrgencyBadge(selectedReferral.urgency)}
                </div>
                <p className="text-xs sm:text-sm text-gray-500">
                  Submitted:{" "}
                  {format(new Date(selectedReferral.submittedAt), "PPP 'at' p")}
                </p>
              </div>
            </div>

            {/* Patient Info - Responsive Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-700 flex items-center gap-2 text-sm sm:text-base">
                  <User className="w-4 h-4 text-blue-500" />
                  Patient Information
                </h3>
                <div className="bg-gray-50 p-3 sm:p-4 rounded-lg space-y-2 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <p className="text-gray-500">Name:</p>
                    <p className="font-medium text-gray-800">
                      {selectedReferral.patientName}
                    </p>

                    <p className="text-gray-500">Age:</p>
                    <p className="font-medium text-gray-800">
                      {selectedReferral.patientAge}
                    </p>

                    <p className="text-gray-500">Gender:</p>
                    <p className="font-medium text-gray-800 capitalize">
                      {selectedReferral.patientGender}
                    </p>

                    <p className="text-gray-500">Contact:</p>
                    <p className="font-medium text-gray-800">
                      {selectedReferral.patientContact}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-gray-700 flex items-center gap-2 text-sm sm:text-base">
                  <Hospital className="w-4 h-4 text-blue-500" />
                  Referring Physician
                </h3>
                <div className="bg-gray-50 p-3 sm:p-4 rounded-lg space-y-3 text-sm">
                  {isLoadingProfile ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                    </div>
                  ) : (
                    <>
                      <div>
                        <p className="text-gray-500 text-xs">Name</p>
                        <p className="font-medium text-gray-800">
                          Dr. {selectedReferral.referringPhysicianName}
                        </p>
                      </div>

                      {/* License Number - Now properly displayed */}
                      <div>
                        <p className="text-gray-500 text-xs flex items-center gap-1">
                          <Award className="w-3 h-3" /> License Number
                        </p>
                        <p className="font-mono text-sm text-gray-800 bg-white px-2 py-1 rounded border border-gray-200">
                          {physicianProfile?.licenseNumber || "Not available"}
                        </p>
                      </div>

                      {/* Specialization */}
                      {physicianProfile?.specialization && (
                        <div>
                          <p className="text-gray-500 text-xs">
                            Specialization
                          </p>
                          <p className="font-medium text-gray-800">
                            {physicianProfile.specialization}
                          </p>
                        </div>
                      )}

                      {/* Hospital */}
                      <div>
                        <p className="text-gray-500 text-xs">Hospital</p>
                        <p className="font-medium text-gray-800">
                          {selectedReferral.referringHospital}
                        </p>
                      </div>

                      {/* Qualifications (if available) */}
                      {physicianProfile?.qualifications &&
                        physicianProfile.qualifications.length > 0 && (
                          <div>
                            <p className="text-gray-500 text-xs">
                              Qualifications
                            </p>
                            <p className="font-medium text-gray-800">
                              {physicianProfile.qualifications.join(", ")}
                            </p>
                          </div>
                        )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Receiving Facility */}
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-700 flex items-center gap-2 text-sm sm:text-base">
                <Building2 className="w-4 h-4 text-blue-500" />
                Receiving Facility
              </h3>
              <div className="bg-gray-50 p-3 sm:p-4 rounded-lg text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <p className="text-gray-500 text-xs">Facility</p>
                    <p className="font-medium text-gray-800">
                      {selectedReferral.referredToFacility}
                    </p>
                  </div>
                  {selectedReferral.referredToDepartment && (
                    <div>
                      <p className="text-gray-500 text-xs">Department</p>
                      <p className="font-medium text-gray-800">
                        {selectedReferral.referredToDepartment}
                      </p>
                    </div>
                  )}
                  {selectedReferral.referredToPhysician && (
                    <div className="sm:col-span-2">
                      <p className="text-gray-500 text-xs">
                        Receiving Physician
                      </p>
                      <p className="font-medium text-gray-800">
                        Dr. {selectedReferral.referredToPhysician}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Physician Notes (if any) */}
            {selectedReferral.physicianNotes && (
              <div className="p-3 sm:p-4 bg-blue-50 rounded-lg">
                <p className="font-medium text-blue-800 mb-1 text-sm sm:text-base">
                  Physician Notes
                </p>
                <p className="text-blue-600 text-xs sm:text-sm">
                  {selectedReferral.physicianNotes}
                </p>
              </div>
            )}

            {/* Approval Section */}
            <div className="p-4 sm:p-5 bg-yellow-50 rounded-lg border border-yellow-200">
              <h3 className="font-medium text-yellow-800 mb-3 text-sm sm:text-base">
                Approve with Payment
              </h3>
              <div className="space-y-3">
                <textarea
                  placeholder="Add approval notes (optional)"
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 sm:px-4 py-2 text-sm border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                />
                <Button
                  onClick={handleApproveFromDetails}
                  className="w-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2 h-12 sm:h-12 text-sm sm:text-base"
                >
                  <Smartphone className="w-5 h-5" />
                  Approve and Send STK Push Prompt
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Payment Modal */}
        <AnimatePresence>
          {showPaymentModal && selectedReferral && (
            <AdminMpesaPayment
              referral={selectedReferral}
              onSuccess={handlePaymentSuccess}
              onFailure={handlePaymentFailure}
              onClose={() => setShowPaymentModal(false)}
            />
          )}
        </AnimatePresence>
      </div>
    );
  }

  // List View
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Search - Responsive */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
        <input
          type="text"
          placeholder="Search by patient, referral #, or physician..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
        />
      </div>

      {/* Referrals List */}
      {!pendingReferrals ? (
        <div className="text-center py-8 sm:py-12">
          <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 animate-spin text-yellow-500 mx-auto" />
        </div>
      ) : filteredReferrals?.length === 0 ? (
        <Card className="p-6 sm:p-8 text-center">
          <Clock className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg sm:text-xl font-medium text-gray-700 mb-2">
            No Pending Referrals
          </h3>
          <p className="text-sm sm:text-base text-gray-500">
            All caught up! No referrals waiting for approval.
          </p>
        </Card>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {filteredReferrals?.map((referral: Referral) => (
            <motion.div
              key={referral._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="p-4 sm:p-5 hover:shadow-lg transition-shadow">
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  {/* Left side - Patient Info */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-base sm:text-lg text-gray-800">
                        {referral.patientName}
                      </h3>
                      {getUrgencyBadge(referral.urgency)}
                    </div>

                    <p className="text-xs sm:text-sm text-gray-500 font-mono">
                      #{referral.referralNumber}
                    </p>

                    <div className="flex flex-col gap-1 text-xs sm:text-sm">
                      <p className="text-gray-600">
                        <span className="text-gray-400">From:</span> Dr.{" "}
                        {referral.referringPhysicianName}
                      </p>
                      <p className="text-gray-600">
                        <span className="text-gray-400">To:</span>{" "}
                        {referral.referredToFacility}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
                      <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                      {format(new Date(referral.submittedAt), "PP")}
                    </div>
                  </div>

                  {/* Right side - Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                    {/* View Details Button - NOW WORKING */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(referral)}
                      className="flex items-center justify-center gap-1 w-full sm:w-auto text-sm"
                    >
                      <Eye className="w-4 h-4" />
                      <span className="sm:hidden">View Details</span>
                      <span className="hidden sm:inline">View</span>
                    </Button>

                    {/* Approve & Send STK Button */}
                    <Button
                      size="sm"
                      onClick={() => handleApproveFromList(referral)}
                      className="bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-1 w-full sm:w-auto text-sm"
                    >
                      <Smartphone className="w-4 h-4" />
                      <span className="whitespace-nowrap">
                        Approve & Send STK
                      </span>
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && selectedReferral && (
          <AdminMpesaPayment
            referral={selectedReferral}
            onSuccess={handlePaymentSuccess}
            onFailure={handlePaymentFailure}
            onClose={() => setShowPaymentModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
