"use client";

import { motion } from "framer-motion";
import {
  CreditCard,
  CheckCircle,
  Clock,
  XCircle,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { Card } from "@/components/ui/card";

interface PaymentStatsProps {
  stats: {
    totalPayments: number;
    totalAmount: number;
    completedPayments: number;
    completedAmount: number;
    pendingPayments: number;
    pendingAmount: number;
    failedPayments: number;
    failedAmount: number;
    successRate: number;
  };
}

export default function PaymentStatsCards({ stats }: PaymentStatsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const cards = [
    {
      title: "Total Payments",
      value: stats.totalPayments,
      subValue: formatCurrency(stats.totalAmount),
      icon: Wallet,
      bgColor: "bg-blue-50",
      textColor: "text-blue-700",
      iconBg: "bg-blue-100",
      trend: "+12%",
    },
    {
      title: "Completed",
      value: stats.completedPayments,
      subValue: formatCurrency(stats.completedAmount),
      icon: CheckCircle,
      bgColor: "bg-green-50",
      textColor: "text-green-700",
      iconBg: "bg-green-100",
    },
    {
      title: "Pending",
      value: stats.pendingPayments,
      subValue: formatCurrency(stats.pendingAmount),
      icon: Clock,
      bgColor: "bg-yellow-50",
      textColor: "text-yellow-700",
      iconBg: "bg-yellow-100",
    },
    {
      title: "Failed",
      value: stats.failedPayments,
      subValue: formatCurrency(stats.failedAmount),
      icon: XCircle,
      bgColor: "bg-red-50",
      textColor: "text-red-700",
      iconBg: "bg-red-100",
    },
    {
      title: "Success Rate",
      value: `${stats.successRate}%`,
      icon: TrendingUp,
      bgColor: "bg-purple-50",
      textColor: "text-purple-700",
      iconBg: "bg-purple-100",
      subValue: `${stats.completedPayments}/${stats.totalPayments} payments`,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={`p-3 sm:p-4 border-0 shadow-sm ${card.bgColor}`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-gray-600 mb-1">{card.title}</p>
                  <p
                    className={`text-lg sm:text-xl font-bold ${card.textColor}`}
                  >
                    {card.value}
                  </p>
                  <p className="text-[10px] sm:text-xs text-gray-500 mt-1">
                    {card.subValue}
                  </p>
                </div>
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg ${card.iconBg} flex items-center justify-center`}
                >
                  <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${card.textColor}`} />
                </div>
              </div>
              {card.trend && (
                <div className="mt-2 text-[10px] text-green-600">
                  ↑ {card.trend} from last month
                </div>
              )}
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
