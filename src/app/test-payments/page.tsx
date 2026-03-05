"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function TestPaymentsPage() {
  const router = useRouter();
  const [paymentId, setPaymentId] = useState("");
  const [testType, setTestType] = useState("success");

  // Generate a test payment ID based on status
  const getTestPaymentId = () => {
    switch (testType) {
      case "success":
        return "success-test-123";
      case "failed":
        return "failed-test-123";
      case "pending":
        return "pending-test-123";
      default:
        return "test-123";
    }
  };

  const handleViewStatus = () => {
    const id = paymentId || getTestPaymentId();
    router.push(`/payments/status/${id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          🧪 Test Payment Status
        </h1>

        <div className="space-y-6">
          {/* Test Type Selection */}
          <div>
            <Label className="mb-2 block">Test Type</Label>
            <RadioGroup value={testType} onValueChange={setTestType}>
              <div className="flex items-center space-x-2 mb-2">
                <RadioGroupItem value="success" id="success" />
                <Label htmlFor="success" className="text-green-600">
                  ✅ Success State
                </Label>
              </div>
              <div className="flex items-center space-x-2 mb-2">
                <RadioGroupItem value="failed" id="failed" />
                <Label htmlFor="failed" className="text-red-600">
                  ❌ Failed State
                </Label>
              </div>
              <div className="flex items-center space-x-2 mb-2">
                <RadioGroupItem value="pending" id="pending" />
                <Label htmlFor="pending" className="text-blue-600">
                  ⏳ Pending State
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Custom Payment ID (Optional) */}
          <div>
            <Label htmlFor="paymentId">Custom Payment ID (Optional)</Label>
            <Input
              id="paymentId"
              placeholder="Enter any payment ID"
              value={paymentId}
              onChange={(e) => setPaymentId(e.target.value)}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              Leave empty to use auto-generated test ID
            </p>
          </div>

          {/* Test Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleViewStatus}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              View Payment Status Page
            </Button>

            <Button
              onClick={() => router.push("/dashboard/send/physician")}
              variant="outline"
              className="w-full"
            >
              Go to Dashboard
            </Button>
          </div>

          {/* Quick Test Links */}
          <div className="border-t pt-4">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Quick Test Links:
            </p>
            <div className="space-y-2">
              <Button
                onClick={() => router.push("/payments/status/success-test-123")}
                variant="ghost"
                className="w-full justify-start text-green-600"
              >
                🔗 /payments/status/success-test-123
              </Button>
              <Button
                onClick={() => router.push("/payments/status/failed-test-123")}
                variant="ghost"
                className="w-full justify-start text-red-600"
              >
                🔗 /payments/status/failed-test-123
              </Button>
              <Button
                onClick={() => router.push("/payments/status/pending-test-123")}
                variant="ghost"
                className="w-full justify-start text-blue-600"
              >
                🔗 /payments/status/pending-test-123
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
