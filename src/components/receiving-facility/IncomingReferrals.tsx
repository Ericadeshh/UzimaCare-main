"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Eye,
  ChevronRight,
  Building2,
  User,
  Calendar,
  Activity,
  Search,
  Filter,
  Download,
  Inbox,
} from "lucide-react";
import { format } from "date-fns";

interface IncomingReferralsProps {
  facilityName: string;
  onSelectReferral: (id: Id<"referrals">) => void;
  token: string;
  limit?: number;
  showAll?: boolean;
}

interface Referral {
  _id: Id<"referrals">;
  patientName: string;
  patientAge: number;
  patientGender: string;
  referringPhysicianName: string;
  referringHospital: string;
  diagnosis: string;
  reasonForReferral: string;
  urgency: "routine" | "urgent" | "emergency";
  status: string;
  createdAt: string;
  referredToDepartment?: string;
  referredToPhysician?: string;
}

export default function IncomingReferrals({
  facilityName,
  onSelectReferral,
  token,
  limit,
  showAll = false,
}: IncomingReferralsProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [urgencyFilter, setUrgencyFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");

  // Fetch incoming referrals
  const referrals = useQuery(
    api.receivingFacility.queries.getIncomingReferrals,
    {
      facilityName,
      token,
      limit,
    },
  ) as Referral[] | undefined;

  // Fetch unique departments from referrals
  const getDepartments = (): string[] => {
    if (!referrals) return [];
    const departments = new Set(
      referrals
        .map((r) => r.referredToDepartment)
        .filter((d): d is string => d !== undefined),
    );
    return Array.from(departments);
  };

  // Filter referrals
  const filteredReferrals = referrals?.filter((referral) => {
    const matchesSearch =
      referral.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      referral.diagnosis.toLowerCase().includes(searchTerm.toLowerCase()) ||
      referral.referringPhysicianName
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesUrgency =
      urgencyFilter === "all" || referral.urgency === urgencyFilter;
    const matchesDepartment =
      departmentFilter === "all" ||
      referral.referredToDepartment === departmentFilter;

    return matchesSearch && matchesUrgency && matchesDepartment;
  });

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
        <Inbox className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-700 mb-2">
          No Incoming Referrals
        </h3>
        <p className="text-gray-500">
          There are no referrals waiting for your facility at this time.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters (only show if showAll is true) */}
      {showAll && (
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by patient, diagnosis, or referring physician..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={urgencyFilter}
            onChange={(e) => setUrgencyFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 w-full sm:w-36"
          >
            <option value="all">All Urgency</option>
            <option value="emergency">Emergency</option>
            <option value="urgent">Urgent</option>
            <option value="routine">Routine</option>
          </select>
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 w-full sm:w-40"
          >
            <option value="all">All Departments</option>
            {getDepartments().map((dept: string) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Referrals List */}
      <div className="space-y-3">
        {filteredReferrals?.map((referral: Referral, index: number) => (
          <motion.div
            key={referral._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card
              className="p-4 hover:shadow-lg transition-all duration-200 cursor-pointer border-l-4"
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
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${getStatusColor(referral.status)}`}
                    >
                      {referral.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span>
                        {referral.patientAge} yrs, {referral.patientGender}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <span className="truncate">
                        {referral.referringHospital}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-gray-400" />
                      <span className="truncate">{referral.diagnosis}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>
                        {format(new Date(referral.createdAt), "MMM dd, yyyy")}
                      </span>
                    </div>
                  </div>

                  {referral.referredToDepartment && (
                    <div className="mt-2 text-xs text-gray-500">
                      Referred to: {referral.referredToDepartment}
                      {referral.referredToPhysician &&
                        ` • Dr. ${referral.referredToPhysician}`}
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
                  <Eye className="w-4 h-4 mr-1" />
                  View Details
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Results count */}
      {showAll && (
        <div className="text-sm text-gray-500 mt-2">
          Showing {filteredReferrals?.length || 0} of {referrals.length}{" "}
          referrals
        </div>
      )}
    </div>
  );
}
