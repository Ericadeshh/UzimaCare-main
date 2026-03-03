import React, { useState } from "react";
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
import { SUBSCRIPTION_PLANS } from "@/lib/mpesa-config";
import { MpesaPayment } from "@/components/payments/MpesaPayment";
import { useSubscriptions } from "@/hooks/useSubscriptions";

interface SubscriptionPlansProps {
  facilityId: string;
  onSubscribe?: () => void;
}

export function SubscriptionPlans({
  facilityId,
  onSubscribe,
}: SubscriptionPlansProps) {
  const [selectedPlan, setSelectedPlan] = useState<string>("BASIC");
  const [billingCycle, setBillingCycle] = useState<
    "monthly" | "quarterly" | "annually"
  >("monthly");
  const [showPayment, setShowPayment] = useState(false);

  const { create, isLoading } = useSubscriptions(facilityId);

  const plan =
    SUBSCRIPTION_PLANS[selectedPlan as keyof typeof SUBSCRIPTION_PLANS];

  const getPrice = () => {
    if (billingCycle === "quarterly") return plan.price * 3;
    if (billingCycle === "annually") return plan.price * 12 * 0.9; // 10% discount
    return plan.price;
  };

  const handleSelectPlan = async (phoneNumber: string) => {
    await create(
      facilityId,
      selectedPlan.toLowerCase(),
      billingCycle,
      phoneNumber,
      true,
    );
    setShowPayment(false);
    onSubscribe?.();
  };

  return (
    <div className="space-y-6">
      {!showPayment ? (
        <>
          <div className="grid md:grid-cols-3 gap-4">
            {Object.entries(SUBSCRIPTION_PLANS).map(([key, plan]) => (
              <Card
                key={key}
                className={`cursor-pointer transition-all ${
                  selectedPlan === key ? "ring-2 ring-blue-500" : ""
                }`}
                onClick={() => setSelectedPlan(key)}
              >
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>
                    {plan.features.map((feature, i) => (
                      <div key={i} className="text-sm">
                        ✓ {feature}
                      </div>
                    ))}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    KES {plan.price.toLocaleString()}
                    <span className="text-sm font-normal text-gray-500">
                      /mo
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Billing Cycle</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={billingCycle}
                onValueChange={(v: any) => setBillingCycle(v)}
              >
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="monthly" id="monthly" />
                    <Label htmlFor="monthly">Monthly</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="quarterly" id="quarterly" />
                    <Label htmlFor="quarterly">Quarterly (3 months)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="annually" id="annually" />
                    <Label htmlFor="annually">Annually (10% discount)</Label>
                  </div>
                </div>
              </RadioGroup>
            </CardContent>
            <CardFooter>
              <Button
                onClick={() => setShowPayment(true)}
                disabled={isLoading}
                className="w-full"
              >
                Continue to Payment
              </Button>
            </CardFooter>
          </Card>
        </>
      ) : (
        <MpesaPayment
          amount={getPrice()}
          paymentType="subscription"
          relatedEntityId={facilityId}
          relatedEntityType="facility"
          description={`${plan.name} Plan - ${billingCycle} subscription`}
          onSuccess={() => handleSelectPlan}
        />
      )}
    </div>
  );
}
