import { ConvexHttpClient } from "convex/browser";
import { NextResponse } from "next/server";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: Request) {
  console.log("📞 WEBHOOK RECEIVED at:", new Date().toISOString());

  try {
    const body = await request.json();
    console.log("📦 Webhook body:", JSON.stringify(body, null, 2));

    const {
      CheckoutRequestID,
      ResultCode,
      ResultDesc,
      TransactionID,
      Amount,
      PhoneNumber,
      MpesaReceiptNumber,
      TransactionDate,
    } = body;

    // Validate required fields
    if (!CheckoutRequestID) {
      console.error("❌ Missing CheckoutRequestID");
      return NextResponse.json(
        { success: false, error: "Missing CheckoutRequestID" },
        { status: 400 },
      );
    }

    // Determine payment status based on ResultCode
    const status = ResultCode === "0" ? "completed" : "failed";
    const failureReason = ResultCode !== "0" ? ResultDesc : undefined;

    console.log(`💰 Payment ${status}: ${CheckoutRequestID}`);
    console.log(`   Transaction ID: ${TransactionID || "N/A"}`);
    console.log(`   Receipt: ${MpesaReceiptNumber || "N/A"}`);

    // Update payment status in Convex
    const { api } = await import("@convex/_generated/api");

    const result = await convex.mutation(
      api.payments.updatePaymentStatusFromCallback,
      {
        checkoutRequestId: CheckoutRequestID,
        status,
        transactionId: TransactionID,
        amount: Amount ? Number(Amount) : undefined,
        phoneNumber: PhoneNumber,
        mpesaReceiptNumber: MpesaReceiptNumber,
        transactionDate: TransactionDate ? Number(TransactionDate) : undefined,
        failureReason,
      },
    );

    console.log(`✅ Payment updated: ${result}`);

    return NextResponse.json({
      success: true,
      paymentId: result,
      message: "Webhook processed successfully",
    });
  } catch (error) {
    console.error("❌ Webhook error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}

// Handle CORS preflight
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 });
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type");
  return response;
}
