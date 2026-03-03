"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { MpesaPayment } from "@/components/payments/MpesaPayment";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

const PLANS = [
  {
    id: "basic",
    name: "Basic",
    price: 2000,
    description: "For small clinics",
    features: [
      "Up to 50 referrals/month",
      "5 user accounts",
      "Basic reporting",
      "Email support",
    ],
    popular: false,
  },
  {
    id: "premium",
    name: "Premium",
    price: 5000,
    description: "For growing hospitals",
    features: [
      "Unlimited referrals",
      "20 user accounts",
      "Advanced analytics",
      "Priority support",
      "API access",
    ],
    popular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 10000,
    description: "For large facilities",
    features: [
      "Unlimited referrals",
      "Unlimited users",
      "Custom integrations",
      "Dedicated account manager",
      "SLA guarantee",
    ],
    popular: false,
  },
];

export default function SubscriptionsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState("premium");
  const [billingCycle, setBillingCycle] = useState<
    "monthly" | "quarterly" | "annually"
  >("monthly");
  const [showPayment, setShowPayment] = useState(false);

  const plan = PLANS.find((p) => p.id === selectedPlan)!;

  const getPrice = () => {
    if (billingCycle === "quarterly") return plan.price * 3;
    if (billingCycle === "annually") return plan.price * 12 * 0.9; // 10% discount
    return plan.price;
  };

  if (!user || user.role !== "admin") {
    return (
      <div className="container mx-auto py-10 text-center">
        <h1 className="text-2xl font-bold mb-4">Admin Access Required</h1>
        <p className="mb-4">
          Only facility administrators can manage subscriptions.
        </p>
        <Button onClick={() => router.push("/login")}>Sign In as Admin</Button>
      </div>
    );
  }

  if (showPayment) {
    return (
      <div className="container mx-auto py-10">
        <Button
          variant="outline"
          onClick={() => setShowPayment(false)}
          className="mb-6"
        >
          ← Back to Plans
        </Button>
        <MpesaPayment
          amount={getPrice()}
          paymentType="subscription"
          description={`${plan.name} Plan - ${billingCycle} subscription`}
          onSuccess={() => {
            setTimeout(() => router.push("/subscriptions/manage"), 3000);
          }}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold mb-4">Subscription Plans</h1>
        <p className="text-xl text-gray-600">
          Choose the right plan for your facility
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {PLANS.map((plan) => (
          <Card
            key={plan.id}
            className={`relative cursor-pointer transition-all ${
              selectedPlan === plan.id
                ? "ring-2 ring-blue-500 shadow-lg"
                : "hover:shadow-md"
            }`}
            onClick={() => setSelectedPlan(plan.id)}
          >
            {plan.popular && (
              <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600">
                Most Popular
              </Badge>
            )}
            <CardHeader>
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-4">
                KES {plan.price.toLocaleString()}
                <span className="text-sm font-normal text-gray-500">/mo</span>
              </div>
              <ul className="space-y-2">
                {plan.features.map((feature, i) => (
                  <li key={i} className="text-sm flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Billing Cycle</CardTitle>
          <CardDescription>
            Choose how often you want to be billed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={billingCycle}
            onValueChange={(v: any) => setBillingCycle(v)}
          >
            <div className="grid gap-4">
              <div className="flex items-center space-x-4 border p-4 rounded">
                <RadioGroupItem value="monthly" id="monthly" />
                <Label htmlFor="monthly" className="flex-1">
                  <span className="font-medium">Monthly</span>
                  <span className="text-sm text-gray-500 ml-2">
                    KES {plan.price}/month
                  </span>
                </Label>
              </div>
              <div className="flex items-center space-x-4 border p-4 rounded">
                <RadioGroupItem value="quarterly" id="quarterly" />
                <Label htmlFor="quarterly" className="flex-1">
                  <span className="font-medium">Quarterly</span>
                  <span className="text-sm text-gray-500 ml-2">
                    KES {plan.price * 3} every 3 months
                  </span>
                </Label>
              </div>
              <div className="flex items-center space-x-4 border p-4 rounded bg-blue-50">
                <RadioGroupItem value="annually" id="annually" />
                <Label htmlFor="annually" className="flex-1">
                  <span className="font-medium">Annual (10% discount)</span>
                  <span className="text-sm text-gray-500 ml-2">
                    KES {plan.price * 12 * 0.9}/year
                  </span>
                </Label>
                <Badge>Best Value</Badge>
              </div>
            </div>
          </RadioGroup>

          <div className="mt-6 p-4 bg-gray-50 rounded">
            <div className="flex justify-between items-center">
              <span className="font-medium">Total to pay:</span>
              <span className="text-2xl font-bold">
                KES {getPrice().toLocaleString()}
              </span>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={() => setShowPayment(true)}
            className="w-full"
            size="lg"
          >
            Continue to Payment
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
