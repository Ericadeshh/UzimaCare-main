"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Building2,
  Phone,
  Calendar,
  Receipt,
  AlertCircle,
  Filter,
  Search,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPhoneNumber } from "@/lib/mpesa/utils";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface AdminPaymentTableProps {
  payments: any[];
  adminToken: string;
  onRefresh?: () => void;
}

type PaymentStatus = "completed" | "pending" | "failed";

// ============================================================================
// STATUS BADGE
// ============================================================================

const StatusBadge = ({ status }: { status: PaymentStatus }) => {
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

  const { bg, text, icon: Icon, label } = config[status] || config.pending;

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
// DETAILS MODAL
// ============================================================================

const PaymentDetailsModal = ({
  payment,
  onClose,
}: {
  payment: any;
  onClose: () => void;
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">Payment Details</h2>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
              <XCircle className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Status */}
            <div className="flex justify-center">
              <StatusBadge status={payment.status} />
            </div>

            {/* Amount */}
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-800">
                {formatCurrency(payment.amount)}
              </p>
              <p className="text-xs text-gray-500">Transaction Amount</p>
            </div>

            {/* Payment Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-sm mb-2">
                  <Receipt className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">Transaction ID</span>
                </div>
                <p className="font-mono text-sm text-gray-800">{payment._id}</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-sm mb-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">Phone Number</span>
                </div>
                <p className="font-mono text-sm text-gray-800">
                  {formatPhoneNumber(payment.phoneNumber)}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-sm mb-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">Date</span>
                </div>
                <p className="text-sm text-gray-800">
                  {new Date(payment.createdAt).toLocaleString()}
                </p>
              </div>

              {payment.mpesaReceiptNumber && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-sm mb-2">
                    <Receipt className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">M-Pesa Receipt</span>
                  </div>
                  <p className="font-mono text-sm text-gray-800">
                    {payment.mpesaReceiptNumber}
                  </p>
                </div>
              )}
            </div>

            {/* Referral Details */}
            {payment.referral && (
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-medium text-blue-700 mb-3">
                  Referral Information
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-blue-400" />
                    <span className="text-blue-600">Patient:</span>
                    <span className="text-blue-800 ml-auto">
                      {payment.referral.patientName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="w-4 h-4 text-blue-400" />
                    <span className="text-blue-600">From:</span>
                    <span className="text-blue-800 ml-auto">
                      {payment.referral.referringHospital}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="w-4 h-4 text-blue-400" />
                    <span className="text-blue-600">To:</span>
                    <span className="text-blue-800 ml-auto">
                      {payment.referral.referredToFacility}
                    </span>
                  </div>
                  {payment.referral.referralNumber && (
                    <div className="flex items-center gap-2 text-sm">
                      <Receipt className="w-4 h-4 text-blue-400" />
                      <span className="text-blue-600">Referral #:</span>
                      <span className="font-mono text-blue-800 ml-auto">
                        {payment.referral.referralNumber}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Failure Reason */}
            {payment.failureReason && (
              <div className="bg-red-50 rounded-lg p-3">
                <p className="text-xs text-red-700 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {payment.failureReason}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={onClose}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ============================================================================
// MAIN TABLE COMPONENT
// ============================================================================

export default function AdminPaymentTable({
  payments,
  adminToken,
  onRefresh,
}: AdminPaymentTableProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | "all">(
    "all",
  );
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Filter payments
  const filteredPayments = payments.filter((payment) => {
    // Apply status filter
    if (statusFilter !== "all" && payment.status !== statusFilter) {
      return false;
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const patientName = payment.referral?.patientName?.toLowerCase() || "";
      const receipt = payment.mpesaReceiptNumber?.toLowerCase() || "";
      const phone = payment.phoneNumber?.toLowerCase() || "";
      const facility =
        payment.referral?.referredToFacility?.toLowerCase() || "";

      return (
        patientName.includes(term) ||
        receipt.includes(term) ||
        phone.includes(term) ||
        facility.includes(term)
      );
    }

    return true;
  });

  const handleViewDetails = (payment: any) => {
    setSelectedPayment(payment);
    setShowDetailsModal(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <>
      {/* Filters */}
      <div className="p-4 border-b border-gray-200">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
        >
          <Filter className="w-4 h-4" />
          <span>Filters</span>
          <ChevronDown
            className={`w-4 h-4 transition-transform ${showFilters ? "rotate-180" : ""}`}
          />
        </button>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mt-4"
            >
              <div className="space-y-4">
                {/* Search */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Search
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      type="text"
                      placeholder="Search by patient, receipt, phone..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) =>
                      setStatusFilter(e.target.value as PaymentStatus | "all")
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Statuses</option>
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>

                {/* Clear Filters */}
                {(searchTerm || statusFilter !== "all") && (
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setStatusFilter("all");
                    }}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Table */}
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
            {filteredPayments.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  No payments found
                </td>
              </tr>
            ) : (
              filteredPayments.map((payment) => (
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
                      {formatCurrency(payment.amount)}
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
                      {payment.referral?.referredToFacility ||
                        payment.facilityName ||
                        "Unknown"}
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
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Showing {filteredPayments.length} of {payments.length} payments
        </p>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4 text-gray-500" />
          </button>
        )}
      </div>

      {/* Details Modal */}
      <AnimatePresence>
        {showDetailsModal && selectedPayment && (
          <PaymentDetailsModal
            payment={selectedPayment}
            onClose={() => setShowDetailsModal(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
