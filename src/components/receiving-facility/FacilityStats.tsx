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
  Legend,
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
  Users,
  Stethoscope,
  Clock,
  CheckCircle2,
  XCircle,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface FacilityStatsProps {
  facilityId: Id<"facilities">;
  facilityName: string;
  token: string;
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function FacilityStats({
  facilityId,
  facilityName,
  token,
}: FacilityStatsProps) {
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

  const handleExport = () => {
    // Implement export functionality
    console.log("Exporting statistics...");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-blue-500" />
          Facility Statistics
        </h2>
        <Button
          onClick={handleExport}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Export Report
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Referrals</p>
              <p className="text-2xl font-bold text-gray-800">
                {monthlyStats?.total || 0}
              </p>
            </div>
            <Activity className="w-8 h-8 text-blue-500" />
          </div>
          <p className="text-xs text-gray-400 mt-2">
            +{monthlyStats?.growth || 0}% from last month
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Acceptance Rate</p>
              <p className="text-2xl font-bold text-gray-800">
                {monthlyStats?.acceptanceRate || 0}%
              </p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Avg. Response Time</p>
              <p className="text-2xl font-bold text-gray-800">
                {monthlyStats?.avgResponseTime || 0}h
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Physicians</p>
              <p className="text-2xl font-bold text-gray-800">
                {physicianStats?.active || 0}
              </p>
            </div>
            <Stethoscope className="w-8 h-8 text-purple-500" />
          </div>
        </Card>
      </div>

      {/* Monthly Trends */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Monthly Referral Trends
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyStats?.monthlyData || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="referrals"
                stroke="#3b82f6"
                name="Referrals"
              />
              <Line
                type="monotone"
                dataKey="accepted"
                stroke="#10b981"
                name="Accepted"
              />
              <Line
                type="monotone"
                dataKey="completed"
                stroke="#8b5cf6"
                name="Completed"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Department Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Referrals by Department
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentStats || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="referrals" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Urgency Distribution
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={urgencyStats || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={80}
                  fill="#8884d8"
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
      </div>

      {/* Physician Performance */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Top Performing Physicians
        </h3>
        <div className="space-y-3">
          {physicianStats?.topPhysicians?.map(
            (physician: any, index: number) => (
              <div
                key={physician.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-medium text-gray-800">
                      Dr. {physician.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {physician.department}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Referrals</p>
                    <p className="font-semibold">{physician.referrals}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Completed</p>
                    <p className="font-semibold">{physician.completed}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Rate</p>
                    <p className="font-semibold text-green-600">
                      {physician.successRate}%
                    </p>
                  </div>
                </div>
              </div>
            ),
          )}
        </div>
      </Card>
    </div>
  );
}
