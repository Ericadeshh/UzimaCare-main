"use client";

import { useEffect, useState } from "react";
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
} from "recharts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, PieChart as PieChartIcon } from "lucide-react";

interface PaymentChartProps {
  payments: any[];
}

type ChartType = "bar" | "pie";

const COLORS = {
  completed: "#10B981",
  pending: "#F59E0B",
  failed: "#EF4444",
};

export default function PaymentChart({ payments }: PaymentChartProps) {
  const [chartType, setChartType] = useState<ChartType>("bar");
  const [barData, setBarData] = useState<any[]>([]);
  const [pieData, setPieData] = useState<any[]>([]);

  useEffect(() => {
    if (!payments.length) return;

    // Prepare bar chart data (last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      return date;
    }).reverse();

    const barChartData = last7Days.map((date) => {
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      const dayPayments = payments.filter((p) => {
        const pDate = new Date(p.createdAt);
        return pDate >= date && pDate < nextDay;
      });

      return {
        date: date.toLocaleDateString("en-KE", { weekday: "short" }),
        completed: dayPayments.filter((p) => p.status === "completed").length,
        pending: dayPayments.filter((p) => p.status === "pending").length,
        failed: dayPayments.filter((p) => p.status === "failed").length,
        amount: dayPayments.reduce((sum, p) => sum + p.amount, 0),
      };
    });

    setBarData(barChartData);

    // Prepare pie chart data
    const completed = payments.filter((p) => p.status === "completed").length;
    const pending = payments.filter((p) => p.status === "pending").length;
    const failed = payments.filter((p) => p.status === "failed").length;

    setPieData([
      { name: "Completed", value: completed, color: COLORS.completed },
      { name: "Pending", value: pending, color: COLORS.pending },
      { name: "Failed", value: failed, color: COLORS.failed },
    ]);
  }, [payments]);

  if (!payments.length) {
    return (
      <Card className="p-6 text-center text-gray-500">
        <BarChart3 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p>No payment data to display</p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-700">Payment Analytics</h3>
        <div className="flex gap-2">
          <Button
            variant={chartType === "bar" ? "default" : "outline"}
            size="sm"
            onClick={() => setChartType("bar")}
            className="flex items-center gap-1"
          >
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Bar</span>
          </Button>
          <Button
            variant={chartType === "pie" ? "default" : "outline"}
            size="sm"
            onClick={() => setChartType("pie")}
            className="flex items-center gap-1"
          >
            <PieChartIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Pie</span>
          </Button>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === "bar" ? (
            <BarChart data={barData}>
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
                        {payload.map((entry: any) => (
                          <div
                            key={entry.name}
                            className="flex items-center gap-2 text-sm"
                          >
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: entry.color }}
                            />
                            <span className="text-gray-600">{entry.name}:</span>
                            <span className="font-medium ml-2">
                              {entry.value}
                            </span>
                          </div>
                        ))}
                        <div className="mt-2 pt-2 border-t">
                          <span className="text-sm text-gray-600">
                            Total Amount:
                          </span>
                          <span className="font-medium ml-2">
                            KES {payload[0]?.payload.amount.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
              <Bar
                dataKey="completed"
                fill={COLORS.completed}
                name="Completed"
              />
              <Bar dataKey="pending" fill={COLORS.pending} name="Pending" />
              <Bar dataKey="failed" fill={COLORS.failed} name="Failed" />
            </BarChart>
          ) : (
            <PieChart>
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
                          {data.value} payments
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Summary */}
      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="p-2 bg-green-50 rounded">
          <div className="text-xs text-green-600">Completed</div>
          <div className="text-sm font-bold text-green-700">
            {pieData.find((d) => d.name === "Completed")?.value || 0}
          </div>
        </div>
        <div className="p-2 bg-yellow-50 rounded">
          <div className="text-xs text-yellow-600">Pending</div>
          <div className="text-sm font-bold text-yellow-700">
            {pieData.find((d) => d.name === "Pending")?.value || 0}
          </div>
        </div>
        <div className="p-2 bg-red-50 rounded">
          <div className="text-xs text-red-600">Failed</div>
          <div className="text-sm font-bold text-red-700">
            {pieData.find((d) => d.name === "Failed")?.value || 0}
          </div>
        </div>
      </div>
    </Card>
  );
}
