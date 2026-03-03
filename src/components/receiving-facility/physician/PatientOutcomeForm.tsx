"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Send,
  XCircle,
  Stethoscope,
  User,
  Building2,
  Calendar,
  Activity,
  ArrowRight,
} from "lucide-react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

interface PatientOutcomeFormProps {
  referralId: Id<"referrals">;
  facilityId: Id<"facilities">;
  physicianId: Id<"users">;
  facilityName: string;
  onBack: () => void;
  token: string;
  onOutcomeSubmitted: () => void;
}

interface Referral {
  _id: Id<"referrals">;
  patientName: string;
  patientAge: number;
  patientGender: string;
  patientContact: string;
  referringPhysicianName: string;
  referringHospital: string;
  diagnosis: string;
  clinicalSummary: string;
  reasonForReferral: string;
  urgency: "routine" | "urgent" | "emergency";
  referralNumber: string;
  createdAt: string;
}

export default function PatientOutcomeForm({
  referralId,
  facilityId,
  physicianId,
  facilityName,
  onBack,
  token,
  onOutcomeSubmitted,
}: PatientOutcomeFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [requiresFurtherReferral, setRequiresFurtherReferral] = useState(false);
  const [formData, setFormData] = useState({
    finalDiagnosis: "",
    treatmentGiven: "",
    furtherReferralFacility: "",
    furtherReferralReason: "",
    notes: "",
  });

  // Fetch referral details
  const referral = useQuery(api.receivingFacility.queries.getReferralDetails, {
    referralId,
    token,
  }) as Referral | undefined;

  // Mutations
  const submitOutcome = useMutation(
    api.receivingFacility.mutations.submitPatientOutcome,
  );

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const result = await submitOutcome({
        referralId,
        facilityId,
        physicianId,
        finalDiagnosis: formData.finalDiagnosis,
        treatmentGiven: formData.treatmentGiven || undefined,
        requiresFurtherReferral,
        furtherReferralFacility: requiresFurtherReferral
          ? formData.furtherReferralFacility
          : undefined,
        furtherReferralReason: requiresFurtherReferral
          ? formData.furtherReferralReason
          : undefined,
        notes: formData.notes || undefined,
        token,
      });

      if (result.success) {
        if (requiresFurtherReferral && result.newReferralId) {
          // Redirect to send physician page to create the new referral
          router.push(
            `/dashboard/send/physician?referralId=${result.newReferralId}`,
          );
        } else {
          onOutcomeSubmitted();
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to submit outcome");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "emergency":
        return "bg-red-100 text-red-700";
      case "urgent":
        return "bg-orange-100 text-orange-700";
      default:
        return "bg-green-100 text-green-700";
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
          Back
        </Button>
        <h2 className="text-2xl font-bold text-gray-800">Patient Outcome</h2>
        <div className="w-24"></div>
      </div>

      {/* Patient Info Card */}
      <Card className="p-6 bg-linear-to-r from-blue-50 to-blue-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white rounded-xl">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">
                {referral.patientName}
              </h3>
              <p className="text-sm text-gray-600">
                {referral.patientAge} yrs • {referral.patientGender} • #
                {referral.referralNumber}
              </p>
            </div>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${getUrgencyColor(referral.urgency)}`}
          >
            {referral.urgency.charAt(0).toUpperCase() +
              referral.urgency.slice(1)}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-gray-500" />
            <span>From: {referral.referringHospital}</span>
          </div>
          <div className="flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-gray-500" />
            <span>Dr. {referral.referringPhysicianName}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span>
              Received: {format(new Date(referral.createdAt), "MMM d, yyyy")}
            </span>
          </div>
        </div>
      </Card>

      {/* Diagnosis Info */}
      <Card className="p-6 bg-gray-50">
        <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-500" />
          Referring Diagnosis
        </h4>
        <p className="text-gray-600 mb-4">{referral.diagnosis}</p>

        <h4 className="font-semibold text-gray-700 mb-2">Clinical Summary</h4>
        <p className="text-gray-600 mb-2">{referral.clinicalSummary}</p>

        <h4 className="font-semibold text-gray-700 mb-2">
          Reason for Referral
        </h4>
        <p className="text-gray-600">{referral.reasonForReferral}</p>
      </Card>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-600">
          <XCircle className="w-5 h-5" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Outcome Form */}
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Final Outcome
          </h3>

          {/* Final Diagnosis */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Final Diagnosis *
            </label>
            <textarea
              name="finalDiagnosis"
              required
              value={formData.finalDiagnosis}
              onChange={handleChange}
              rows={3}
              placeholder="Enter the final diagnosis after examination..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Treatment Given */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Treatment Given
            </label>
            <textarea
              name="treatmentGiven"
              value={formData.treatmentGiven}
              onChange={handleChange}
              rows={2}
              placeholder="Describe the treatment provided..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Further Referral Toggle */}
          <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg">
            <input
              type="checkbox"
              id="requiresFurtherReferral"
              checked={requiresFurtherReferral}
              onChange={(e) => setRequiresFurtherReferral(e.target.checked)}
              className="w-4 h-4 text-blue-600"
            />
            <label
              htmlFor="requiresFurtherReferral"
              className="text-sm font-medium text-gray-700"
            >
              Patient requires further referral to another facility
            </label>
          </div>

          {/* Further Referral Details */}
          {requiresFurtherReferral && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4 p-4 bg-blue-50 rounded-lg"
            >
              <h4 className="font-medium text-blue-800">
                New Referral Details
              </h4>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Referral Facility *
                </label>
                <input
                  type="text"
                  name="furtherReferralFacility"
                  required={requiresFurtherReferral}
                  value={formData.furtherReferralFacility}
                  onChange={handleChange}
                  placeholder="Enter facility name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason for Further Referral *
                </label>
                <textarea
                  name="furtherReferralReason"
                  required={requiresFurtherReferral}
                  value={formData.furtherReferralReason}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Why is further referral needed?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <p className="text-xs text-gray-500">
                You'll be redirected to create a new referral after submission
              </p>
            </motion.div>
          )}

          {/* Additional Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={2}
              placeholder="Any additional notes..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={onBack}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Submitting...
                </>
              ) : requiresFurtherReferral ? (
                <>
                  Submit & Create Referral
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              ) : (
                <>
                  Submit Outcome
                  <CheckCircle2 className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
