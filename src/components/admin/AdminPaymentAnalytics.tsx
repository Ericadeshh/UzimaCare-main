"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  BarChart3,
  PieChart,
  LineChart,
  Building2,
  Users,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fetchQuery } from "convex/nextjs";
import { api } from "@convex/_generated/api";
import {
  LineChart as ReLineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import AdminPaymentTable from "./AdminPaymentTable";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface AdminPaymentAnalyticsProps {
  adminToken: string;
  adminUser: any;
}

interface AnalyticsData {
  overview: {
    total: number;
    totalAmount: number;
    completed: number;
    completedAmount: number;
    pending: number;
    pendingAmount: number;
    failed: number;
    failedAmount: number;
    successRate: number;
    averageAmount: number;
  };
  dailyTrends: Array<{
    date: string;
    count: number;
    amount: number;
    completed: number;
  }>;
  byStatus: {
    pending: number;
    completed: number;
    failed: number;
  };
  topFacilities: Array<{
    name: string;
    count: number;
    amount: number;
  }>;
  recentPayments: Array<any>;
  totalPayments: number;
  totalAmount: number;
}

type TimeRange = "today" | "week" | "month" | "year" | "all";

// ============================================================================
// STATS CARD COMPONENT
// ============================================================================

const StatsCard = ({
  title,
  value,
  subValue,
  icon: Icon,
  trend,
  color,
}: any) => {
  const trendPositive = trend?.startsWith("+");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-2">
        <div className={`p-2 rounded-lg ${color.bg}`}>
          <Icon className={`w-5 h-5 ${color.text}`} />
        </div>
        {trend && (
          <div
            className={`flex items-center gap-1 text-xs ${
              trendPositive ? "text-green-600" : "text-red-600"
            }`}
          >
            {trendPositive ? (
              <ArrowUpRight className="w-3 h-3" />
            ) : (
              <ArrowDownRight className="w-3 h-3" />
            )}
            <span>{trend}</span>
          </div>
        )}
      </div>
      <p className="text-sm text-gray-600 mb-1">{title}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      {subValue && <p className="text-xs text-gray-500 mt-1">{subValue}</p>}
    </motion.div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function AdminPaymentAnalytics({
  adminToken,
  adminUser,
}: AdminPaymentAnalyticsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>("month");
  const [chartType, setChartType] = useState<"line" | "bar">("line");

  useEffect(() => {
    const fetchAnalytics = async () => {
      setIsLoading(true);
      try {
        const analytics = await fetchQuery(
          api.payments.analytics.getPaymentAnalytics,
          {
            adminToken,
            timeRange,
          },
        );
        setData(analytics);
      } catch (error) {
        console.error("Error fetching payment analytics:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (adminToken) {
      fetchAnalytics();
    }
  }, [adminToken, timeRange]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-KE").format(num);
  };

  const handleExport = () => {
    if (!data) return;

    const csvData = [
      ["Metric", "Value"],
      ["Total Payments", data.overview.total],
      ["Total Amount", data.overview.totalAmount],
      ["Completed Payments", data.overview.completed],
      ["Completed Amount", data.overview.completedAmount],
      ["Pending Payments", data.overview.pending],
      ["Pending Amount", data.overview.pendingAmount],
      ["Failed Payments", data.overview.failed],
      ["Failed Amount", data.overview.failedAmount],
      ["Success Rate", `${data.overview.successRate}%`],
      ["Average Amount", data.overview.averageAmount],
      [],
      ["Date", "Transactions", "Amount", "Completed"],
      ...data.dailyTrends.map((d) => [d.date, d.count, d.amount, d.completed]),
    ];

    const csv = csvData.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payment-analytics-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Stats Skeletons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl p-6 shadow-sm">
              <div className="h-4 bg-gray-200 rounded w-24 animate-pulse mb-2" />
              <div className="h-8 bg-gray-200 rounded w-32 animate-pulse" />
            </div>
          ))}
        </div>

        {/* Chart Skeleton */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse mb-4" />
          <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />
        </div>

        {/* Table Skeleton */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-4 border-b">
            <div className="h-6 bg-gray-200 rounded w-32 animate-pulse" />
          </div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-4 border-b">
              <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Failed to Load Data
        </h3>
        <p className="text-gray-500 mb-4">Unable to fetch payment analytics</p>
        <Button
          onClick={() => window.location.reload()}
          className="bg-blue-600"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  const COLORS = {
    completed: "#10B981",
    pending: "#F59E0B",
    failed: "#EF4444",
  };

  const pieData = [
    {
      name: "Completed",
      value: data.byStatus.completed,
      color: COLORS.completed,
    },
    { name: "Pending", value: data.byStatus.pending, color: COLORS.pending },
    { name: "Failed", value: data.byStatus.failed, color: COLORS.failed },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Payment Analytics
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Comprehensive overview of all payment transactions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as TimeRange)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="year">Last Year</option>
            <option value="all">All Time</option>
          </select>
          <Button
            onClick={handleExport}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Revenue"
          value={formatCurrency(data.overview.totalAmount)}
          subValue={`${formatNumber(data.overview.total)} transactions`}
          icon={DollarSign}
          trend="+12.5%"
          color={{ bg: "bg-blue-50", text: "text-blue-600" }}
        />
        <StatsCard
          title="Success Rate"
          value={`${data.overview.successRate}%`}
          subValue={`${formatNumber(data.overview.completed)} completed`}
          icon={CheckCircle}
          trend="+5.2%"
          color={{ bg: "bg-green-50", text: "text-green-600" }}
        />
        <StatsCard
          title="Average Amount"
          value={formatCurrency(data.overview.averageAmount)}
          subValue="per transaction"
          icon={TrendingUp}
          trend="+3.1%"
          color={{ bg: "bg-purple-50", text: "text-purple-600" }}
        />
        <StatsCard
          title="Pending Amount"
          value={formatCurrency(data.overview.pendingAmount)}
          subValue={`${formatNumber(data.overview.pending)} pending`}
          icon={Clock}
          trend="-2.3%"
          color={{ bg: "bg-yellow-50", text: "text-yellow-600" }}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Trend Chart */}
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-700">Payment Trends</h3>
            <div className="flex gap-2">
              <Button
                variant={chartType === "line" ? "default" : "outline"}
                size="sm"
                onClick={() => setChartType("line")}
              >
                <LineChart className="w-4 h-4" />
              </Button>
              <Button
                variant={chartType === "bar" ? "default" : "outline"}
                size="sm"
                onClick={() => setChartType("bar")}
              >
                <BarChart3 className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === "line" ? (
                <AreaChart data={data.dailyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white p-3 shadow-lg rounded-lg border">
                            <p className="text-sm font-medium text-gray-900 mb-2">
                              {label}
                            </p>
                            <div className="space-y-1">
                              <p className="text-sm text-gray-600">
                                Amount:{" "}
                                <span className="font-medium text-gray-900">
                                  {formatCurrency(payload[0]?.value as number)}
                                </span>
                              </p>
                              <p className="text-sm text-gray-600">
                                Transactions:{" "}
                                <span className="font-medium text-gray-900">
                                  {payload[1]?.value}
                                </span>
                              </p>
                              <p className="text-sm text-gray-600">
                                Completed:{" "}
                                <span className="font-medium text-gray-900">
                                  {payload[2]?.value}
                                </span>
                              </p>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="amount"
                    stroke="#3B82F6"
                    fill="#3B82F6"
                    fillOpacity={0.1}
                    name="Amount (KES)"
                  />
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="count"
                    stroke="#10B981"
                    fill="#10B981"
                    fillOpacity={0.1}
                    name="Transactions"
                  />
                </AreaChart>
              ) : (
                <BarChart data={data.dailyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white p-3 shadow-lg rounded-lg border">
                            <p className="text-sm font-medium text-gray-900 mb-2">
                              {label}
                            </p>
                            <p className="text-sm text-gray-600">
                              Amount:{" "}
                              <span className="font-medium">
                                {formatCurrency(payload[0]?.value as number)}
                              </span>
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend />
                  <Bar dataKey="amount" fill="#3B82F6" name="Amount (KES)" />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Status Distribution Pie Chart */}
        <Card className="p-6">
          <h3 className="font-semibold text-gray-700 mb-4">
            Payment Status Distribution
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-2 shadow-lg rounded-lg border">
                          <p className="text-sm font-medium">{data.name}</p>
                          <p className="text-sm text-gray-600">
                            {data.value} payments •{" "}
                            {formatCurrency(data.value * 200)}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </RePieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="text-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mx-auto mb-1" />
              <p className="text-xs text-gray-500">Completed</p>
              <p className="text-sm font-bold text-gray-700">
                {data.byStatus.completed}
              </p>
            </div>
            <div className="text-center">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mx-auto mb-1" />
              <p className="text-xs text-gray-500">Pending</p>
              <p className="text-sm font-bold text-gray-700">
                {data.byStatus.pending}
              </p>
            </div>
            <div className="text-center">
              <div className="w-2 h-2 bg-red-500 rounded-full mx-auto mb-1" />
              <p className="text-xs text-gray-500">Failed</p>
              <p className="text-sm font-bold text-gray-700">
                {data.byStatus.failed}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Top Facilities */}
      <Card className="p-6">
        <h3 className="font-semibold text-gray-700 mb-4">
          Top Referring Facilities
        </h3>
        <div className="space-y-4">
          {data.topFacilities.map((facility, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    index === 0
                      ? "bg-yellow-100"
                      : index === 1
                        ? "bg-gray-100"
                        : index === 2
                          ? "bg-orange-100"
                          : "bg-blue-50"
                  }`}
                >
                  <Building2
                    className={`w-4 h-4 ${
                      index === 0
                        ? "text-yellow-600"
                        : index === 1
                          ? "text-gray-600"
                          : index === 2
                            ? "text-orange-600"
                            : "text-blue-600"
                    }`}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {facility.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {facility.count} transactions
                  </p>
                </div>
              </div>
              <p className="text-sm font-semibold text-gray-800">
                {formatCurrency(facility.amount)}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Recent Payments Table */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h3 className="font-semibold text-gray-700">Recent Transactions</h3>
        </div>
        <AdminPaymentTable
          payments={data.recentPayments}
          adminToken={adminToken}
          onRefresh={() => {
            setIsLoading(true);
            setTimeout(() => window.location.reload(), 500);
          }}
        />
      </Card>
    </div>
  );
}
