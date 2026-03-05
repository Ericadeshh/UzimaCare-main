"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  CreditCard,
  Download,
  Filter,
  Calendar,
  Search,
  ChevronDown,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  FileText,
  User,
  Building2,
  Phone,
  Receipt,
  Eye,
  RefreshCw,
  BarChart3,
  PieChart,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { REFERRAL_FEE } from "@/lib/mpesa-config";
import {
  getPhysicianPaymentHistory,
  getPhysicianPaymentStats,
} from "@/lib/payment";
import { formatPhoneNumber } from "@/lib/mpesa/utils";
import PaymentStatsCards from "./PaymentStatsCards";
import PaymentChart from "./PaymentChart";
import { useDebounce } from "@/hooks/useDebounce";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface PhysicianPaymentHistoryProps {
  userId: string;
  token: string;
  onBack?: () => void;
}

interface PaymentRecord {
  _id: string;
  amount: number;
  phoneNumber: string;
  status: "pending" | "completed" | "failed";
  createdAt: number;
  updatedAt?: number;
  mpesaReceiptNumber?: string;
  failureReason?: string;
  referral?: {
    _id: string;
    patientName: string;
    patientAge?: number;
    patientGender?: string;
    referredToFacility: string;
    referringHospital: string;
    referralNumber?: string;
    urgency: string;
  } | null;
}

interface PaymentStats {
  totalPayments: number;
  totalAmount: number;
  completedPayments: number;
  completedAmount: number;
  pendingPayments: number;
  pendingAmount: number;
  failedPayments: number;
  failedAmount: number;
  successRate: number;
}

type FilterStatus = "all" | "completed" | "pending" | "failed";
type DateRange = "week" | "month" | "year" | "all";

// ============================================================================
// LOADING SKELETON
// ============================================================================

const PaymentHistorySkeleton = () => (
  <div className="min-h-screen bg-gray-50 p-4">
    <div className="max-w-7xl mx-auto">
      {/* Header Skeleton */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse mb-2" />
        <div className="h-4 bg-gray-200 rounded w-64 animate-pulse" />
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl p-4 shadow-sm">
            <div className="h-4 bg-gray-200 rounded w-20 animate-pulse mb-2" />
            <div className="h-8 bg-gray-200 rounded w-16 animate-pulse" />
          </div>
        ))}
      </div>

      {/* Chart Skeleton */}
      <div className="bg-white rounded-xl p-4 shadow-sm mb-6">
        <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />
      </div>

      {/* Table Skeleton */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="h-6 bg-gray-200 rounded w-32 animate-pulse" />
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="p-4 border-b border-gray-100">
            <div className="flex justify-between items-center">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-48 animate-pulse" />
                <div className="h-3 bg-gray-200 rounded w-32 animate-pulse" />
              </div>
              <div className="h-6 bg-gray-200 rounded w-16 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ============================================================================
// EMPTY STATE
// ============================================================================

const EmptyState = ({ onNewReferral }: { onNewReferral?: () => void }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="text-center py-12"
  >
    <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
      <Wallet className="w-10 h-10 text-blue-500" />
    </div>
    <h3 className="text-lg font-semibold text-gray-800 mb-2">
      No Payments Yet
    </h3>
    <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
      When you create referrals and make payments, they will appear here. Start
      by creating your first referral.
    </p>
    {onNewReferral && (
      <Button onClick={onNewReferral} className="bg-blue-600 hover:bg-blue-700">
        Create New Referral
      </Button>
    )}
  </motion.div>
);

// ============================================================================
// STATUS BADGE COMPONENT
// ============================================================================

const StatusBadge = ({ status }: { status: string }) => {
  const config = {
    completed: {
      bg: "bg-green-100",
      text: "text-green-700",
      icon: CheckCircle,
      label: "Completed",
    },
    pending: {
      bg: "bg-yellow-100",
      text: "text-yellow-700",
      icon: Clock,
      label: "Pending",
    },
    failed: {
      bg: "bg-red-100",
      text: "text-red-700",
      icon: XCircle,
      label: "Failed",
    },
  };

  const {
    bg,
    text,
    icon: Icon,
    label,
  } = config[status as keyof typeof config] || config.pending;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${bg} ${text}`}
    >
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function PhysicianPaymentHistory({
  userId,
  token,
  onBack,
}: PhysicianPaymentHistoryProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [filteredPayments, setFilteredPayments] = useState<PaymentRecord[]>([]);
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [dateRange, setDateRange] = useState<DateRange>("month");
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(
    null,
  );
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Fetch payment data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [paymentHistory, paymentStats] = await Promise.all([
          getPhysicianPaymentHistory(token, userId),
          getPhysicianPaymentStats(token, userId),
        ]);

        setPayments(paymentHistory);
        setStats(paymentStats);
      } catch (error) {
        console.error("Error fetching payment data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (token && userId) {
      fetchData();
    }
  }, [token, userId]);

  // debounced search term
  const debouncedSearch = useDebounce(searchTerm, 300);
  // Apply filters
  useEffect(() => {
    let filtered = [...payments];

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((p) => p.status === statusFilter);
    }

    // Apply date range filter
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const oneWeek = 7 * oneDay;
    const oneMonth = 30 * oneDay;
    const oneYear = 365 * oneDay;

    switch (dateRange) {
      case "week":
        filtered = filtered.filter((p) => p.createdAt > now - oneWeek);
        break;
      case "month":
        filtered = filtered.filter((p) => p.createdAt > now - oneMonth);
        break;
      case "year":
        filtered = filtered.filter((p) => p.createdAt > now - oneYear);
        break;
      case "all":
      default:
        // No filter
        break;
    }

    // Apply search filter with debounced value
    if (debouncedSearch) {
      const term = debouncedSearch.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.referral?.patientName.toLowerCase().includes(term) ||
          p.mpesaReceiptNumber?.toLowerCase().includes(term) ||
          p.referral?.referralNumber?.toLowerCase().includes(term),
      );
    }

    setFilteredPayments(filtered);
  }, [payments, statusFilter, dateRange, debouncedSearch]); // Changed from searchTerm to debouncedSearch

  const handleViewDetails = (payment: PaymentRecord) => {
    setSelectedPayment(payment);
    setShowDetailsModal(true);
  };

  const handleExport = () => {
    // Prepare CSV data
    const csvData = filteredPayments.map((p) => ({
      Date: new Date(p.createdAt).toLocaleDateString(),
      Patient: p.referral?.patientName || "Unknown",
      Amount: p.amount,
      Status: p.status,
      "M-Pesa Receipt": p.mpesaReceiptNumber || "N/A",
      Facility: p.referral?.referredToFacility || "Unknown",
      Phone: formatPhoneNumber(p.phoneNumber),
    }));

    // Convert to CSV
    const headers = Object.keys(csvData[0] || {});
    const csv = [
      headers.join(","),
      ...csvData.map((row) =>
        headers
          .map((h) => JSON.stringify(row[h as keyof typeof row]))
          .join(","),
      ),
    ].join("\n");

    // Download
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payments-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  if (isLoading) {
    return <PaymentHistorySkeleton />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {onBack && (
                <button
                  onClick={onBack}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
              )}
              <div>
                <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <CreditCard className="w-6 h-6 text-blue-500" />
                  Payment History
                </h1>
                <p className="text-sm text-gray-500">
                  Track and manage all your referral payments
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={handleExport}
                variant="outline"
                className="flex items-center gap-2"
                disabled={filteredPayments.length === 0}
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export</span>
              </Button>
              <Button
                onClick={() => router.push("/dashboard/send/physician")}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                New Referral
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Cards */}
        {stats && <PaymentStatsCards stats={stats} />}

        {/* Chart */}
        <div className="mb-6">
          <PaymentChart payments={payments} />
        </div>

        {/* Filters */}
        <Card className="mb-6 overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center justify-between w-full text-left"
            >
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <span className="font-medium text-gray-700">Filters</span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-gray-500 transition-transform ${
                  showFilters ? "rotate-180" : ""
                }`}
              />
            </button>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 space-y-4">
                  {/* Search */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Search
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        type="text"
                        placeholder="Search by patient, receipt, facility..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>

                  {/* Filter Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Status Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <select
                        value={statusFilter}
                        onChange={(e) =>
                          setStatusFilter(e.target.value as FilterStatus)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="all">All Payments</option>
                        <option value="completed">Completed</option>
                        <option value="pending">Pending</option>
                        <option value="failed">Failed</option>
                      </select>
                    </div>

                    {/* Date Range Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date Range
                      </label>
                      <select
                        value={dateRange}
                        onChange={(e) =>
                          setDateRange(e.target.value as DateRange)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="week">Last 7 Days</option>
                        <option value="month">Last 30 Days</option>
                        <option value="year">Last Year</option>
                        <option value="all">All Time</option>
                      </select>
                    </div>
                  </div>

                  {/* Active Filters */}
                  {(statusFilter !== "all" ||
                    dateRange !== "month" ||
                    searchTerm) && (
                    <div className="flex items-center gap-2 pt-2">
                      <span className="text-xs text-gray-500">
                        Active filters:
                      </span>
                      {statusFilter !== "all" && (
                        <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-full text-xs">
                          Status: {statusFilter}
                        </span>
                      )}
                      {dateRange !== "month" && (
                        <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-full text-xs">
                          Range: {dateRange}
                        </span>
                      )}
                      {searchTerm && (
                        <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-full text-xs">
                          Search: "{searchTerm}"
                        </span>
                      )}
                      <button
                        onClick={() => {
                          setStatusFilter("all");
                          setDateRange("month");
                          setSearchTerm("");
                        }}
                        className="text-xs text-red-600 hover:text-red-700"
                      >
                        Clear all
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>

        {/* Payments Table */}
        <Card className="overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-700">
                Payment Records ({filteredPayments.length})
              </h2>
              <button
                onClick={() => {
                  setIsLoading(true);
                  window.location.reload();
                }}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
              >
                <RefreshCw className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>

          {filteredPayments.length === 0 ? (
            <EmptyState
              onNewReferral={() => router.push("/dashboard/send/physician")}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Patient
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Receipt
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Facility
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredPayments.map((payment) => (
                    <motion.tr
                      key={payment._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(payment.createdAt).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(payment.createdAt).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">
                          {payment.referral?.patientName || "Unknown"}
                        </div>
                        {payment.referral?.patientAge && (
                          <div className="text-xs text-gray-500">
                            {payment.referral.patientAge} yrs •{" "}
                            {payment.referral.patientGender}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          KES {payment.amount.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <StatusBadge status={payment.status} />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {payment.mpesaReceiptNumber ? (
                          <div className="text-sm font-mono text-gray-600">
                            {payment.mpesaReceiptNumber}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-900">
                          {payment.referral?.referredToFacility || "Unknown"}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <button
                          onClick={() => handleViewDetails(payment)}
                          className="p-1 hover:bg-blue-50 rounded text-blue-600 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Details Modal */}
      <AnimatePresence>
        {showDetailsModal && selectedPayment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowDetailsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-800">
                    Payment Details
                  </h2>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <XCircle className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Status Badge */}
                  <div className="flex justify-center">
                    <StatusBadge status={selectedPayment.status} />
                  </div>

                  {/* Amount */}
                  <div className="text-center">
                    <p className="text-3xl font-bold text-gray-800">
                      KES {selectedPayment.amount.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">Referral Fee</p>
                  </div>

                  {/* Payment Details */}
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <h3 className="font-medium text-gray-700 mb-2">
                      Payment Information
                    </h3>

                    <div className="flex items-center gap-3 text-sm">
                      <Receipt className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">Transaction ID:</span>
                      <span className="font-mono text-gray-800 ml-auto">
                        {selectedPayment._id.slice(-8)}
                      </span>
                    </div>

                    {selectedPayment.mpesaReceiptNumber && (
                      <div className="flex items-center gap-3 text-sm">
                        <Receipt className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">M-Pesa Receipt:</span>
                        <span className="font-mono text-gray-800 ml-auto">
                          {selectedPayment.mpesaReceiptNumber}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">Phone Number:</span>
                      <span className="font-mono text-gray-800 ml-auto">
                        {formatPhoneNumber(selectedPayment.phoneNumber)}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-sm">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">Date:</span>
                      <span className="text-gray-800 ml-auto">
                        {new Date(selectedPayment.createdAt).toLocaleString()}
                      </span>
                    </div>

                    {selectedPayment.failureReason && (
                      <div className="mt-3 p-3 bg-red-50 rounded-lg">
                        <p className="text-xs text-red-700 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {selectedPayment.failureReason}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Referral Details */}
                  {selectedPayment.referral && (
                    <div className="bg-blue-50 rounded-lg p-4 space-y-3">
                      <h3 className="font-medium text-blue-700 mb-2">
                        Referral Details
                      </h3>

                      <div className="flex items-center gap-3 text-sm">
                        <User className="w-4 h-4 text-blue-400" />
                        <span className="text-blue-600">Patient:</span>
                        <span className="text-blue-800 ml-auto">
                          {selectedPayment.referral.patientName}
                        </span>
                      </div>

                      {selectedPayment.referral.referralNumber && (
                        <div className="flex items-center gap-3 text-sm">
                          <FileText className="w-4 h-4 text-blue-400" />
                          <span className="text-blue-600">Referral #:</span>
                          <span className="font-mono text-blue-800 ml-auto">
                            {selectedPayment.referral.referralNumber}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-3 text-sm">
                        <Building2 className="w-4 h-4 text-blue-400" />
                        <span className="text-blue-600">To Facility:</span>
                        <span className="text-blue-800 ml-auto">
                          {selectedPayment.referral.referredToFacility}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-sm">
                        <Building2 className="w-4 h-4 text-blue-400" />
                        <span className="text-blue-600">From Facility:</span>
                        <span className="text-blue-800 ml-auto">
                          {selectedPayment.referral.referringHospital}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={() => {
                        setShowDetailsModal(false);
                        router.push(`/payments/status/${selectedPayment._id}`);
                      }}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      View Full Status
                    </Button>
                    <Button
                      onClick={() => setShowDetailsModal(false)}
                      variant="outline"
                      className="flex-1"
                    >
                      Close
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
