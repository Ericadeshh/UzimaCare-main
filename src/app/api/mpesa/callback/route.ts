import { NextResponse } from "next/server";
import { fetchMutation } from "convex/nextjs";
import { api } from "@convex/_generated/api";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("📲 M-Pesa Callback received:", JSON.stringify(body, null, 2));

    // Extract the relevant data from the callback
    const { Body } = body;
    const { stkCallback } = Body;
    const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } =
      stkCallback;

    // Determine payment status
    const status = ResultCode === 0 ? "completed" : "failed";

    // Extract metadata if available
    let mpesaReceiptNumber, amount, phoneNumber, transactionDate;

    if (CallbackMetadata?.Item) {
      CallbackMetadata.Item.forEach((item: any) => {
        switch (item.Name) {
          case "MpesaReceiptNumber":
            mpesaReceiptNumber = item.Value;
            break;
          case "Amount":
            amount = item.Value;
            break;
          case "PhoneNumber":
            phoneNumber = item.Value;
            break;
          case "TransactionDate":
            transactionDate = item.Value;
            break;
        }
      });
    }

    // Update payment status in Convex
    await fetchMutation(api.payments.updatePaymentStatusFromCallback, {
      checkoutRequestId: CheckoutRequestID,
      status,
      failureReason: ResultCode !== 0 ? ResultDesc : undefined,
      mpesaReceiptNumber,
      amount,
      phoneNumber,
      transactionDate,
    });

    return NextResponse.json({
      ResultCode: 0,
      ResultDesc: "Success",
    });
  } catch (error) {
    console.error("Error processing M-Pesa callback:", error);
    return NextResponse.json(
      {
        ResultCode: 1,
        ResultDesc: "Error processing callback",
      },
      { status: 500 },
    );
  }
}

// M-Pesa sends a GET request to verify the endpoint
export async function GET() {
  return NextResponse.json({
    message: "M-Pesa callback endpoint is active",
  });
}
