"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeft,
  Download,
  Calendar,
  Search,
  Eye,
  RefreshCw,
  TrendingUp,
  Wallet,
  FileText,
  Users,
  Building2,
  Activity,
} from "lucide-react";
import { Input } from "@/components/ui/input";

const StatusBadge = ({ status }: { status: string }) => {
  const config = {
    completed: {
      icon: CheckCircle2,
      text: "Completed",
      className: "bg-green-500 text-white",
    },
    pending: {
      icon: Clock,
      text: "Pending",
      className: "bg-yellow-500 text-white",
    },
    failed: {
      icon: XCircle,
      text: "Failed",
      className: "bg-red-500 text-white",
    },
  };

  const {
    icon: Icon,
    text,
    className,
  } = config[status as keyof typeof config] || config.pending;

  return (
    <Badge
      className={`flex items-center gap-1 px-3 py-1.5 font-medium ${className}`}
    >
      <Icon className="w-3.5 h-3.5" />
      <span>{text}</span>
    </Badge>
  );
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatPaymentDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-KE", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function PaymentHistoryPage() {
  const { user, isLoading: authLoading, token } = useAuth();
  const router = useRouter();
  const [filter, setFilter] = useState<
    "all" | "completed" | "pending" | "failed"
  >("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<
    "all" | "today" | "week" | "month" | "year"
  >("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const payments = useQuery(
    api.payments.queries.getPhysicianPayments,
    token && user?._id
      ? {
          token,
          physicianId: user._id as Id<"users">,
          status: filter === "all" ? undefined : filter,
          limit: itemsPerPage,
          offset: (currentPage - 1) * itemsPerPage,
        }
      : "skip",
  );

  const stats = useQuery(
    api.payments.queries.getPhysicianPaymentStats,
    token && user?._id
      ? { token, physicianId: user._id as Id<"users"> }
      : "skip",
  );

  const filteredPayments = payments?.filter((payment) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      payment.referral?.patientName?.toLowerCase().includes(searchLower) ||
      payment.mpesaReceiptNumber?.toLowerCase().includes(searchLower) ||
      payment.referral?.referredToFacility?.toLowerCase().includes(searchLower)
    );
  });

  const getDateFilteredPayments = () => {
    if (!filteredPayments) return [];
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    switch (dateRange) {
      case "today":
        const todayStart = new Date().setHours(0, 0, 0, 0);
        return filteredPayments.filter((p) => p.createdAt >= todayStart);
      case "week":
        return filteredPayments.filter((p) => p.createdAt >= now - 7 * oneDay);
      case "month":
        return filteredPayments.filter((p) => p.createdAt >= now - 30 * oneDay);
      case "year":
        return filteredPayments.filter(
          (p) => p.createdAt >= now - 365 * oneDay,
        );
      default:
        return filteredPayments;
    }
  };

  const displayPayments = getDateFilteredPayments();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-700">Loading payment history...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  // Navigate to admin dashboard with specific view
  const navigateToView = (view: string) => {
    // Store the view in session storage to tell admin dashboard which tab to open
    sessionStorage.setItem("adminDashboardView", view);
    router.push("/dashboard/send/admin");
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Simple Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-600" />
              <h1 className="text-xl font-semibold text-gray-900">
                Payment History
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="bg-blue-600 text-white shadow-md">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Total Transactions</p>
                    <p className="text-2xl font-bold mt-1">
                      {stats.totalPayments}
                    </p>
                  </div>
                  <Wallet className="w-8 h-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-green-600 text-white shadow-md">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">Total Revenue</p>
                    <p className="text-xl font-bold mt-1">
                      {formatCurrency(stats.totalAmount)}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-emerald-600 text-white shadow-md">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-emerald-100 text-sm">Success Rate</p>
                    <p className="text-2xl font-bold mt-1">
                      {stats.successRate}%
                    </p>
                  </div>
                  <CheckCircle2 className="w-8 h-8 text-emerald-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-purple-600 text-white shadow-md">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">Completed</p>
                    <p className="text-2xl font-bold mt-1">
                      {stats.completedPayments}
                    </p>
                  </div>
                  <FileText className="w-8 h-8 text-purple-200" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search by patient, receipt, or facility..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={() => setFilter("all")}
                variant={filter === "all" ? "default" : "outline"}
                size="sm"
                className={filter === "all" ? "bg-blue-600" : ""}
              >
                All
              </Button>
              <Button
                onClick={() => setFilter("completed")}
                variant={filter === "completed" ? "default" : "outline"}
                size="sm"
                className={
                  filter === "completed"
                    ? "bg-green-600"
                    : "border-green-200 text-green-700"
                }
              >
                Completed
              </Button>
              <Button
                onClick={() => setFilter("pending")}
                variant={filter === "pending" ? "default" : "outline"}
                size="sm"
                className={
                  filter === "pending"
                    ? "bg-yellow-500"
                    : "border-yellow-200 text-yellow-700"
                }
              >
                Pending
              </Button>
              <Button
                onClick={() => setFilter("failed")}
                variant={filter === "failed" ? "default" : "outline"}
                size="sm"
                className={
                  filter === "failed"
                    ? "bg-red-600"
                    : "border-red-200 text-red-700"
                }
              >
                Failed
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Calendar className="w-4 h-4 mr-1" />
                    {dateRange === "all"
                      ? "All Time"
                      : dateRange === "today"
                        ? "Today"
                        : dateRange === "week"
                          ? "Week"
                          : dateRange === "month"
                            ? "Month"
                            : "Year"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setDateRange("all")}>
                    All Time
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setDateRange("today")}>
                    Today
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setDateRange("week")}>
                    This Week
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setDateRange("month")}>
                    This Month
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setDateRange("year")}>
                    This Year
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Payments Table */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">
                Transaction History
              </CardTitle>
              <span className="text-sm text-gray-500">
                {displayPayments?.length || 0} records
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {displayPayments && displayPayments.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead>Date</TableHead>
                        <TableHead>Patient</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="hidden md:table-cell">
                          Receipt
                        </TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayPayments.map((payment) => (
                        <TableRow
                          key={payment._id}
                          className="hover:bg-gray-50"
                        >
                          <TableCell className="whitespace-nowrap text-sm">
                            {formatPaymentDate(payment.createdAt)}
                          </TableCell>
                          <TableCell>
                            <p className="font-medium">
                              {payment.referral?.patientName || "N/A"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {payment.referral?.patientAge || "N/A"} yrs •{" "}
                              {payment.referral?.patientGender || "N/A"}
                            </p>
                          </TableCell>
                          <TableCell className="font-semibold text-gray-900 whitespace-nowrap">
                            {formatCurrency(payment.amount)}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={payment.status} />
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {payment.mpesaReceiptNumber ? (
                              <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                                {payment.mpesaReceiptNumber}
                              </code>
                            ) : (
                              <span className="text-xs text-gray-400">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {payment.referralId && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      router.push(
                                        `/dashboard/referrals/${payment.referralId}`,
                                      )
                                    }
                                  >
                                    <FileText className="w-4 h-4 mr-2" />
                                    View Referral Details
                                  </DropdownMenuItem>
                                )}
                                {payment.mpesaReceiptNumber && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      navigator.clipboard.writeText(
                                        payment.mpesaReceiptNumber!,
                                      )
                                    }
                                  >
                                    <Download className="w-4 h-4 mr-2" />
                                    Copy Receipt Number
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {stats && stats.totalPayments > itemsPerPage && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t">
                    <p className="text-sm text-gray-500">
                      Showing{" "}
                      {Math.min(
                        currentPage * itemsPerPage,
                        displayPayments.length,
                      )}{" "}
                      of {stats.totalPayments} transactions
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCurrentPage((p) => Math.max(1, p - 1))
                        }
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => p + 1)}
                        disabled={
                          currentPage * itemsPerPage >=
                          (stats?.totalPayments || 0)
                        }
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No payment records found
                </h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  {searchTerm || filter !== "all" || dateRange !== "all"
                    ? "Try adjusting your search filters to see more results"
                    : "Payments will appear here once referrals are approved and patients complete M-Pesa payments"}
                </p>
                <Button
                  onClick={() => navigateToView("referrals")}
                  className="mt-6 bg-blue-600 hover:bg-blue-700"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Go to Pending Referrals
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
