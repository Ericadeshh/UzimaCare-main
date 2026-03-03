"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  User,
  Calendar,
  Building2,
  Activity,
  FileText,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Pill,
  Syringe,
  HeartPulse,
  Stethoscope,
  Phone,
  Mail,
  MapPin,
  Download,
  Printer,
  MessageSquare,
} from "lucide-react";
import { format } from "date-fns";

interface ReferralDetailsProps {
  referralId: Id<"referrals">;
  facilityName: string;
  onBack: () => void;
  token: string;
}

interface Referral {
  _id: Id<"referrals">;
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
  status: string;
  createdAt: string;
  submittedAt: string;
  physicianNotes?: string;
  attachments?: string[];
  referralNumber: string;
}

export default function ReferralDetails({
  referralId,
  facilityName,
  onBack,
  token,
}: ReferralDetailsProps) {
  const [actionInProgress, setActionInProgress] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [acceptNotes, setAcceptNotes] = useState("");
  const [department, setDepartment] = useState("");
  const [assignedPhysician, setAssignedPhysician] = useState("");

  // Fetch referral details
  const referral = useQuery(api.receivingFacility.queries.getReferralDetails, {
    referralId,
    token,
  }) as Referral | undefined;

  // Fetch facility departments
  const facility = useQuery(api.receivingFacility.queries.getFacilityByName, {
    facilityName,
    token,
  });

  // Mutations
  const acceptReferral = useMutation(
    api.receivingFacility.mutations.acceptReferral,
  );
  const rejectReferral = useMutation(
    api.receivingFacility.mutations.rejectReferral,
  );
  const completeReferral = useMutation(
    api.receivingFacility.mutations.completeReferral,
  );

  const handleAccept = async () => {
    setActionInProgress(true);
    try {
      await acceptReferral({
        referralId,
        facilityName,
        department,
        assignedPhysician: assignedPhysician || undefined,
        notes: acceptNotes || undefined,
        token,
      });
      // Refresh or show success message
    } catch (error) {
      console.error("Error accepting referral:", error);
    } finally {
      setActionInProgress(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) return;

    setActionInProgress(true);
    try {
      await rejectReferral({
        referralId,
        facilityName,
        reason: rejectionReason,
        token,
      });
      setShowRejectForm(false);
      // Refresh or show success message
    } catch (error) {
      console.error("Error rejecting referral:", error);
    } finally {
      setActionInProgress(false);
    }
  };

  const handleComplete = async () => {
    setActionInProgress(true);
    try {
      await completeReferral({
        referralId,
        facilityName,
        token,
      });
    } catch (error) {
      console.error("Error completing referral:", error);
    } finally {
      setActionInProgress(false);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "emergency":
        return "bg-red-100 text-red-700 border-red-200";
      case "urgent":
        return "bg-orange-100 text-orange-700 border-orange-200";
      default:
        return "bg-green-100 text-green-700 border-green-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "approved":
        return "bg-green-100 text-green-700";
      case "completed":
        return "bg-blue-100 text-blue-700";
      case "rejected":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  if (!referral) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          onClick={onBack}
          variant="outline"
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Incoming
        </Button>
        <h2 className="text-2xl font-bold text-gray-800">Referral Details</h2>
        <div className="w-24"></div>
      </div>

      {/* Referral Card */}
      <Card className="p-6">
        <div className="space-y-6">
          {/* Header with patient info and status */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">
                  {referral.patientName}
                </h3>
                <p className="text-sm text-gray-500">
                  {referral.patientAge} years • {referral.patientGender} • Ref:{" "}
                  {referral.referralNumber}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${getUrgencyColor(referral.urgency)}`}
              >
                {referral.urgency === "emergency" && (
                  <AlertCircle className="w-4 h-4" />
                )}
                {referral.urgency === "urgent" && <Clock className="w-4 h-4" />}
                {referral.urgency === "routine" && (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                {referral.urgency.charAt(0).toUpperCase() +
                  referral.urgency.slice(1)}
              </span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(referral.status)}`}
              >
                {referral.status}
              </span>
            </div>
          </div>

          {/* Patient Contact */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Phone className="w-4 h-4 text-blue-500" />
              Patient Contact
            </h4>
            <p className="text-sm">{referral.patientContact}</p>
          </div>

          {/* Referral Source */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-500" />
                Referring Facility
              </h4>
              <p className="font-medium">{referral.referringHospital}</p>
              <p className="text-sm text-gray-500 mt-1">
                Dr. {referral.referringPhysicianName}
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-500" />
                Referral Timeline
              </h4>
              <p className="text-sm">
                <span className="text-gray-500">Submitted:</span>{" "}
                {format(new Date(referral.submittedAt), "PPP 'at' p")}
              </p>
              <p className="text-sm mt-1">
                <span className="text-gray-500">Received:</span>{" "}
                {format(new Date(referral.createdAt), "PPP 'at' p")}
              </p>
            </div>
          </div>

          {/* Medical Information */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-700 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" />
              Medical Information
            </h4>

            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-1">
                Diagnosis
              </p>
              <p>{referral.diagnosis}</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-1">
                Clinical Summary
              </p>
              <p className="text-sm">{referral.clinicalSummary}</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-1">
                Reason for Referral
              </p>
              <p className="text-sm">{referral.reasonForReferral}</p>
            </div>

            {referral.physicianNotes && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-1">
                  Additional Notes
                </p>
                <p className="text-sm">{referral.physicianNotes}</p>
              </div>
            )}
          </div>

          {/* Attachments */}
          {referral.attachments && referral.attachments.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-700">Attachments</h4>
              <div className="flex gap-2">
                {referral.attachments.map((attachment, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Document {index + 1}
                    <Download className="w-3 h-3 ml-1" />
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Actions based on status */}
          {referral.status === "pending" && (
            <div className="pt-4 border-t">
              {showRejectForm ? (
                <div className="space-y-3">
                  <textarea
                    placeholder="Please provide a reason for rejection..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={handleReject}
                      disabled={!rejectionReason.trim() || actionInProgress}
                      className="bg-red-500 hover:bg-red-600 text-white"
                    >
                      {actionInProgress ? "Processing..." : "Confirm Rejection"}
                    </Button>
                    <Button
                      onClick={() => setShowRejectForm(false)}
                      variant="outline"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Assign to Department
                      </label>
                      <select
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Department</option>
                        {facility?.departments?.map((dept: string) => (
                          <option key={dept} value={dept}>
                            {dept}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Assign to Physician (Optional)
                      </label>
                      <input
                        type="text"
                        value={assignedPhysician}
                        onChange={(e) => setAssignedPhysician(e.target.value)}
                        placeholder="Dr. Name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes (Optional)
                    </label>
                    <textarea
                      value={acceptNotes}
                      onChange={(e) => setAcceptNotes(e.target.value)}
                      placeholder="Add any notes about this referral..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      rows={2}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleAccept}
                      disabled={!department || actionInProgress}
                      className="bg-green-500 hover:bg-green-600 text-white"
                    >
                      {actionInProgress ? "Processing..." : "Accept Referral"}
                    </Button>
                    <Button
                      onClick={() => setShowRejectForm(true)}
                      variant="outline"
                      className="text-red-600"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {referral.status === "approved" && (
            <div className="pt-4 border-t flex justify-end">
              <Button
                onClick={handleComplete}
                disabled={actionInProgress}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                {actionInProgress ? "Processing..." : "Mark as Completed"}
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
