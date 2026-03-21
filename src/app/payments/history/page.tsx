"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
} from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";

// Status badge component
const StatusBadge = ({ status }: { status: string }) => {
  const config = {
    completed: {
      icon: CheckCircle2,
      text: "Completed",
      className: "bg-green-100 text-green-800 border-green-200",
    },
    pending: {
      icon: Clock,
      text: "Pending",
      className: "bg-yellow-100 text-yellow-800 border-yellow-200",
    },
    failed: {
      icon: XCircle,
      text: "Failed",
      className: "bg-red-100 text-red-800 border-red-200",
    },
  };

  const {
    icon: Icon,
    text,
    className,
  } = config[status as keyof typeof config] || config.pending;

  return (
    <Badge
      variant="outline"
      className={`flex items-center gap-1 px-2 py-1 ${className}`}
    >
      <Icon className="w-3 h-3" />
      <span>{text}</span>
    </Badge>
  );
};

/**
 * Format amount for display
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format payment date for display
 */
function formatPaymentDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60)
    return `${diffMins} minute${diffMins === 1 ? "" : "s"} ago`;
  if (diffHours < 24)
    return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString("en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
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

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Fetch payments for this physician
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

  // Fetch payment stats
  const stats = useQuery(
    api.payments.queries.getPhysicianPaymentStats,
    token && user?._id
      ? { token, physicianId: user._id as Id<"users"> }
      : "skip",
  );

  // Filter payments by search term
  const filteredPayments = payments?.filter((payment) => {
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();
    return (
      payment.referral?.patientName?.toLowerCase().includes(searchLower) ||
      payment.mpesaReceiptNumber?.toLowerCase().includes(searchLower) ||
      payment.transactionId?.toLowerCase().includes(searchLower) ||
      payment.referral?.referredToFacility?.toLowerCase().includes(searchLower)
    );
  });

  // Filter by date range
  const getDateFilteredPayments = () => {
    if (!filteredPayments) return [];

    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    switch (dateRange) {
      case "today":
        const todayStart = new Date().setHours(0, 0, 0, 0);
        return filteredPayments.filter((p) => p.createdAt >= todayStart);
      case "week":
        const weekAgo = now - 7 * oneDay;
        return filteredPayments.filter((p) => p.createdAt >= weekAgo);
      case "month":
        const monthAgo = now - 30 * oneDay;
        return filteredPayments.filter((p) => p.createdAt >= monthAgo);
      case "year":
        const yearAgo = now - 365 * oneDay;
        return filteredPayments.filter((p) => p.createdAt >= yearAgo);
      default:
        return filteredPayments;
    }
  };

  const displayPayments = getDateFilteredPayments();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading payment history...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard/send/physician">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Payment History
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Track and manage all your referral payments
                </p>
              </div>
            </div>
            <Link href="/payments">
              <Button className="bg-blue-600 hover:bg-blue-700">
                <CreditCard className="w-4 h-4 mr-2" />
                Make New Payment
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600 font-medium">
                      Total Payments
                    </p>
                    <p className="text-2xl font-bold text-blue-900 mt-1">
                      {stats.totalPayments}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center">
                    <Wallet className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600 font-medium">
                      Total Amount
                    </p>
                    <p className="text-2xl font-bold text-green-900 mt-1">
                      {formatCurrency(stats.totalAmount)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-emerald-600 font-medium">
                      Success Rate
                    </p>
                    <p className="text-2xl font-bold text-emerald-900 mt-1">
                      {stats.successRate}%
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-emerald-200 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-600 font-medium">
                      Completed
                    </p>
                    <p className="text-2xl font-bold text-purple-900 mt-1">
                      {stats.completedPayments}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-200 rounded-full flex items-center justify-center">
                    <FileText className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search by patient name, receipt, or facility..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Status Filter */}
              <div className="flex gap-2">
                <Button
                  onClick={() => setFilter("all")}
                  variant={filter === "all" ? "default" : "outline"}
                  size="sm"
                >
                  All
                </Button>
                <Button
                  onClick={() => setFilter("completed")}
                  variant={filter === "completed" ? "default" : "outline"}
                  size="sm"
                  className="bg-green-50 hover:bg-green-100"
                >
                  Completed
                </Button>
                <Button
                  onClick={() => setFilter("pending")}
                  variant={filter === "pending" ? "default" : "outline"}
                  size="sm"
                  className="bg-yellow-50 hover:bg-yellow-100"
                >
                  Pending
                </Button>
                <Button
                  onClick={() => setFilter("failed")}
                  variant={filter === "failed" ? "default" : "outline"}
                  size="sm"
                  className="bg-red-50 hover:bg-red-100"
                >
                  Failed
                </Button>
              </div>

              {/* Date Range Filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Calendar className="w-4 h-4 mr-2" />
                    {dateRange === "all"
                      ? "All Time"
                      : dateRange === "today"
                        ? "Today"
                        : dateRange === "week"
                          ? "This Week"
                          : dateRange === "month"
                            ? "This Month"
                            : "This Year"}
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
          </CardContent>
        </Card>

        {/* Payments Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Transaction History</span>
              <span className="text-sm font-normal text-gray-500">
                {displayPayments?.length || 0} payments found
              </span>
            </CardTitle>
            <CardDescription>
              View all your referral payment transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {displayPayments && displayPayments.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Patient</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Receipt</TableHead>
                        <TableHead>Facility</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayPayments.map((payment) => (
                        <TableRow
                          key={payment._id}
                          className="hover:bg-gray-50"
                        >
                          <TableCell className="font-medium">
                            {formatPaymentDate(payment.createdAt)}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {payment.referral?.patientName || "N/A"}
                              </p>
                              <p className="text-xs text-gray-500">
                                Age: {payment.referral?.patientAge || "N/A"}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-semibold text-gray-900">
                              {formatCurrency(payment.amount)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={payment.status} />
                          </TableCell>
                          <TableCell>
                            {payment.mpesaReceiptNumber ? (
                              <span className="text-xs font-mono text-gray-600">
                                {payment.mpesaReceiptNumber}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <p className="text-sm text-gray-700">
                              {payment.referral?.referredToFacility || "N/A"}
                            </p>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => {
                                    if (payment.referralId) {
                                      router.push(
                                        `/dashboard/referrals/${payment.referralId}`,
                                      );
                                    }
                                  }}
                                >
                                  <FileText className="w-4 h-4 mr-2" />
                                  View Referral
                                </DropdownMenuItem>
                                {payment.mpesaReceiptNumber && (
                                  <DropdownMenuItem
                                    onClick={() => {
                                      navigator.clipboard.writeText(
                                        payment.mpesaReceiptNumber!,
                                      );
                                    }}
                                  >
                                    <Download className="w-4 h-4 mr-2" />
                                    Copy Receipt
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
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <p className="text-sm text-gray-500">
                      Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                      {Math.min(
                        currentPage * itemsPerPage,
                        displayPayments.length,
                      )}{" "}
                      of {stats.totalPayments} results
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
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No payments found
                </h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm || filter !== "all" || dateRange !== "all"
                    ? "Try adjusting your filters"
                    : "You haven't made any payments yet"}
                </p>
                {!searchTerm && filter === "all" && dateRange === "all" && (
                  <Link href="/payments">
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <CreditCard className="w-4 h-4 mr-2" />
                      Make Your First Payment
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
