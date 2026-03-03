"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import {
  CheckCircle2,
  User,
  Building2,
  Stethoscope,
  ArrowRight,
  Calendar,
  FileText,
} from "lucide-react";

interface ReviewedOutcomesProps {
  facilityId: Id<"facilities">;
  physicianId: Id<"users">;
  token: string;
}

interface Outcome {
  _id: Id<"patientOutcomes">;
  referralId: Id<"referrals">;
  finalDiagnosis: string;
  treatmentGiven?: string;
  requiresFurtherReferral: boolean;
  furtherReferralFacility?: string;
  furtherReferralCreated?: boolean;
  notes?: string;
  outcomeDate: string;
  referral?: {
    patientName: string;
    patientAge: number;
    patientGender: string;
    referringPhysicianName: string;
    referringHospital: string;
    referralNumber: string;
  };
}

export default function ReviewedOutcomes({
  facilityId,
  physicianId,
  token,
}: ReviewedOutcomesProps) {
  // Fetch outcomes for this physician
  const outcomes = useQuery(
    api.receivingFacility.queries.getPhysicianOutcomes,
    {
      facilityId,
      physicianId,
      token,
    },
  ) as Outcome[] | undefined;

  if (!outcomes) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (outcomes.length === 0) {
    return (
      <Card className="p-12 text-center">
        <CheckCircle2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-700 mb-2">
          No Outcomes Recorded Yet
        </h3>
        <p className="text-gray-500">
          Patient outcomes will appear here after you review referrals
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {outcomes.map((outcome) => (
        <Card
          key={outcome._id}
          className="p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="flex-1">
              {/* Patient Info */}
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">
                    {outcome.referral?.patientName}
                  </h3>
                  <p className="text-xs text-gray-500">
                    #{outcome.referral?.referralNumber} •{" "}
                    {outcome.referral?.patientAge} yrs,{" "}
                    {outcome.referral?.patientGender}
                  </p>
                </div>
              </div>

              {/* Outcome Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Final Diagnosis</p>
                  <p className="text-sm font-medium">
                    {outcome.finalDiagnosis}
                  </p>
                </div>

                {outcome.treatmentGiven && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">
                      Treatment Given
                    </p>
                    <p className="text-sm">{outcome.treatmentGiven}</p>
                  </div>
                )}
              </div>

              {/* Referral Info */}
              <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  From: {outcome.referral?.referringHospital}
                </span>
                <span className="flex items-center gap-1">
                  <Stethoscope className="w-3 h-3" />
                  Dr. {outcome.referral?.referringPhysicianName}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Reviewed:{" "}
                  {format(new Date(outcome.outcomeDate), "MMM d, yyyy")}
                </span>
              </div>

              {/* Further Referral Indicator */}
              {outcome.requiresFurtherReferral && (
                <div className="mt-3 p-2 bg-blue-50 rounded-lg flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-blue-500" />
                  <span className="text-xs text-blue-700">
                    Further referral to {outcome.furtherReferralFacility}
                    {outcome.furtherReferralCreated && " (Created)"}
                  </span>
                </div>
              )}

              {/* Notes */}
              {outcome.notes && (
                <div className="mt-2 text-xs text-gray-500 italic">
                  <FileText className="w-3 h-3 inline mr-1" />
                  {outcome.notes}
                </div>
              )}
            </div>

            <div className="text-xs text-gray-400 whitespace-nowrap">
              {format(new Date(outcome.outcomeDate), "hh:mm a")}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
