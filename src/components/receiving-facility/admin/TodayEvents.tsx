"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  User,
  Building2,
  Stethoscope,
  FileText,
  ChevronRight,
  Activity,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";

interface TodayEventsProps {
  facilityId: Id<"facilities">;
  date: string;
  token: string;
}

interface TodayData {
  referrals: any[];
  events: any[];
  clinicDay?: {
    isOpen: boolean;
    maxPatients: number;
    currentBookings: number;
  };
}

export default function TodayEvents({
  facilityId,
  date,
  token,
}: TodayEventsProps) {
  // Fetch today's data
  const todayData = useQuery(api.receivingFacility.queries.getTodayData, {
    facilityId,
    date,
    token,
  }) as TodayData | undefined;

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

  if (!todayData) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <Calendar className="w-5 h-5 text-purple-500" />
        Today's Events • {format(new Date(date), "MMMM d, yyyy")}
      </h3>

      {/* Clinic Status */}
      {todayData.clinicDay && (
        <div
          className={`p-4 rounded-lg mb-4 ${
            todayData.clinicDay.isOpen
              ? "bg-green-50 border border-green-200"
              : "bg-red-50 border border-red-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {todayData.clinicDay.isOpen ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
              <span
                className={`font-medium ${
                  todayData.clinicDay.isOpen ? "text-green-700" : "text-red-700"
                }`}
              >
                Clinic is {todayData.clinicDay.isOpen ? "Open" : "Closed"}
              </span>
            </div>
            {todayData.clinicDay.isOpen && (
              <span className="text-sm text-gray-600">
                Bookings: {todayData.clinicDay.currentBookings}/
                {todayData.clinicDay.maxPatients}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Events Section */}
      {todayData.events && todayData.events.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Scheduled Events
          </h4>
          <div className="space-y-2">
            {todayData.events.map((event) => (
              <div
                key={event._id}
                className="p-3 bg-purple-50 rounded-lg flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-purple-800">{event.title}</p>
                  <p className="text-xs text-purple-600">{event.description}</p>
                </div>
                <span className="text-xs text-purple-600">
                  {format(new Date(event.startDate), "hh:mm a")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Referrals Section */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">
          Today's Referrals ({todayData.referrals.length})
        </h4>
        {todayData.referrals.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <FileText className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No referrals scheduled for today</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {todayData.referrals.map((referral) => (
              <motion.div
                key={referral._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-800">
                      {referral.patientName}
                    </span>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${getUrgencyColor(referral.urgency)}`}
                  >
                    {getUrgencyIcon(referral.urgency)}
                    {referral.urgency}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-2">
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    {referral.referringHospital}
                  </span>
                  <span className="flex items-center gap-1">
                    <Stethoscope className="w-3 h-3" />
                    Dr. {referral.referringPhysicianName}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${getStatusColor(referral.status)}`}
                  >
                    {referral.status}
                  </span>
                  <span className="text-xs text-gray-400">
                    #{referral.referralNumber}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* View All Button */}
      {todayData.referrals.length > 5 && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full mt-4 text-purple-600"
          onClick={() => {
            /* Navigate to full referrals view */
          }}
        >
          View All Referrals
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      )}
    </Card>
  );
}
