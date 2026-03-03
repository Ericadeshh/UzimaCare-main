"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Clock,
  AlertCircle,
  CheckCircle2,
  User,
  Building2,
  Activity,
  Stethoscope,
  FileText,
  ChevronRight,
} from "lucide-react";
import { format } from "date-fns";

interface TodayReferralsProps {
  facilityName: string;
  date: string;
  onSelectReferral: (id: Id<"referrals">) => void;
  token: string;
}

interface Referral {
  _id: Id<"referrals">;
  patientName: string;
  patientAge: number;
  patientGender: string;
  referringPhysicianName: string;
  referringHospital: string;
  diagnosis: string;
  urgency: "routine" | "urgent" | "emergency";
  status: string;
  createdAt: string;
  referralNumber: string;
  referredToDepartment?: string;
}

export default function TodayReferrals({
  facilityName,
  date,
  onSelectReferral,
  token,
}: TodayReferralsProps) {
  // Fetch today's referrals
  const referrals = useQuery(api.receivingFacility.queries.getTodayReferrals, {
    facilityName,
    date,
    token,
  }) as Referral[] | undefined;

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

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case "emergency":
        return <AlertCircle className="w-3 h-3" />;
      case "urgent":
        return <Clock className="w-3 h-3" />;
      default:
        return <CheckCircle2 className="w-3 h-3" />;
    }
  };

  if (!referrals) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (referrals.length === 0) {
    return (
      <Card className="p-12 text-center">
        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-700 mb-2">
          No Referrals Today
        </h3>
        <p className="text-gray-500">
          There are no referrals scheduled for{" "}
          {format(new Date(date), "MMMM d, yyyy")}
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Today's Referrals ({referrals.length})
      </h3>

      {referrals.map((referral: Referral, index: number) => (
        <motion.div
          key={referral._id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <Card
            className="p-4 hover:shadow-lg transition-all cursor-pointer border-l-4"
            style={{
              borderLeftColor:
                referral.urgency === "emergency"
                  ? "#ef4444"
                  : referral.urgency === "urgent"
                    ? "#f97316"
                    : "#10b981",
            }}
            onClick={() => onSelectReferral(referral._id)}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h3 className="font-semibold text-gray-800">
                    {referral.patientName}
                  </h3>
                  <span
                    className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${getUrgencyColor(referral.urgency)}`}
                  >
                    {getUrgencyIcon(referral.urgency)}
                    {referral.urgency.charAt(0).toUpperCase() +
                      referral.urgency.slice(1)}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span>
                      {referral.patientAge} yrs, {referral.patientGender}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-gray-400" />
                    <span className="truncate">
                      Dr. {referral.referringPhysicianName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-gray-400" />
                    <span className="truncate">{referral.diagnosis}</span>
                  </div>
                </div>

                {referral.referredToDepartment && (
                  <div className="mt-2 text-xs text-gray-500">
                    <Stethoscope className="w-3 h-3 inline mr-1" />
                    Referred to: {referral.referredToDepartment}
                  </div>
                )}
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="w-full sm:w-auto text-blue-600"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectReferral(referral._id);
                }}
              >
                Review Patient
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
