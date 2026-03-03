"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { Card } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import {
  TrendingUp,
  Calendar,
  Activity,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

interface TotalReferralsStatsProps {
  facilityId: Id<"facilities">;
  token: string;
  detailed?: boolean;
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function TotalReferralsStats({
  facilityId,
  token,
  detailed = false,
}: TotalReferralsStatsProps) {
  // Fetch statistics
  const monthlyStats = useQuery(api.receivingFacility.queries.getMonthlyStats, {
    facilityId,
    token,
  });

  const departmentStats = useQuery(
    api.receivingFacility.queries.getDepartmentStats,
    {
      facilityId,
      token,
    },
  );

  const urgencyStats = useQuery(api.receivingFacility.queries.getUrgencyStats, {
    facilityId,
    token,
  });

  const physicianStats = useQuery(
    api.receivingFacility.queries.getPhysicianStats,
    {
      facilityId,
      token,
    },
  );

  if (!monthlyStats) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4">
          <p className="text-xs text-gray-500">Total Referrals</p>
          <p className="text-2xl font-bold text-gray-800">
            {monthlyStats.total}
          </p>
          <div className="flex items-center gap-1 mt-1">
            {monthlyStats.growth > 0 ? (
              <ArrowUp className="w-3 h-3 text-green-500" />
            ) : (
              <ArrowDown className="w-3 h-3 text-red-500" />
            )}
            <span
              className={`text-xs ${monthlyStats.growth > 0 ? "text-green-500" : "text-red-500"}`}
            >
              {Math.abs(monthlyStats.growth)}%
            </span>
          </div>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-gray-500">Acceptance Rate</p>
          <p className="text-2xl font-bold text-gray-800">
            {monthlyStats.acceptanceRate}%
          </p>
        </Card>
      </div>

      {/* Monthly Trends */}
      {detailed && (
        <>
          <Card className="p-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">
              Monthly Trends
            </h4>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyStats.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="referrals"
                    stroke="#3b82f6"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="accepted"
                    stroke="#10b981"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Department Distribution */}
          <Card className="p-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">
              By Department
            </h4>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departmentStats || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 8 }} />
                  <YAxis tick={{ fontSize: 8 }} />
                  <Tooltip />
                  <Bar dataKey="referrals" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Urgency Distribution */}
          <Card className="p-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">
              By Urgency
            </h4>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={urgencyStats || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={50}
                    dataKey="value"
                  >
                    {urgencyStats?.map((entry: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </>
      )}

      {/* Quick Stats */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4 text-green-500" /> Completed
          </span>
          <span className="font-medium">
            {monthlyStats.monthlyData?.reduce(
              (acc, m) => acc + (m.completed || 0),
              0,
            ) || 0}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 flex items-center gap-1">
            <Clock className="w-4 h-4 text-yellow-500" /> Pending
          </span>
          <span className="font-medium">
            {monthlyStats.monthlyData?.reduce(
              (acc, m) => acc + (m.pending || 0),
              0,
            ) || 0}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 flex items-center gap-1">
            <XCircle className="w-4 h-4 text-red-500" /> Rejected
          </span>
          <span className="font-medium">
            {monthlyStats.monthlyData?.reduce(
              (acc, m) => acc + (m.rejected || 0),
              0,
            ) || 0}
          </span>
        </div>
      </div>
    </div>
  );
}
