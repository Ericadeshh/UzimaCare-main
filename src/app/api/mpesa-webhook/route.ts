import { ConvexHttpClient } from "convex/browser";
import { NextResponse } from "next/server";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: Request) {
  console.log("📞 WEBHOOK RECEIVED at:", new Date().toISOString());

  try {
    const body = await request.json();
    console.log("📦 Raw webhook body:", JSON.stringify(body, null, 2));

    // ========== HANDLE BOTH M-PESA CALLBACK FORMATS ==========
    let checkoutRequestId: string | null = null;
    let resultCode: string | null = null;
    let resultDesc: string | null = null;
    let transactionId: string | null = null;
    let amount: number | null = null;
    let phoneNumber: string | null = null;
    let mpesaReceiptNumber: string | null = null;

    // Format 1: Flat structure (from our manual tests)
    if (body.CheckoutRequestID) {
      checkoutRequestId = body.CheckoutRequestID;
      resultCode = body.ResultCode?.toString();
      resultDesc = body.ResultDesc;
      transactionId = body.TransactionID;
      amount = body.Amount;
      phoneNumber = body.PhoneNumber;
      mpesaReceiptNumber = body.MpesaReceiptNumber;
    }
    // Format 2: Nested structure (real M-Pesa callback)
    else if (body.Body?.stkCallback) {
      const callback = body.Body.stkCallback;
      checkoutRequestId = callback.CheckoutRequestID;
      resultCode = callback.ResultCode?.toString();
      resultDesc = callback.ResultDesc;

      // Extract metadata from CallbackMetadata
      if (callback.CallbackMetadata?.Item) {
        for (const item of callback.CallbackMetadata.Item) {
          if (item.Name === "MpesaReceiptNumber")
            mpesaReceiptNumber = item.Value;
          if (item.Name === "TransactionID") transactionId = item.Value;
          if (item.Name === "Amount") amount = item.Value;
          if (item.Name === "PhoneNumber") phoneNumber = item.Value;
        }
      }
    }

    // Validate we got a CheckoutRequestID
    if (!checkoutRequestId) {
      console.error("❌ Could not extract CheckoutRequestID from body");
      return NextResponse.json(
        { success: false, error: "Missing CheckoutRequestID" },
        { status: 400 },
      );
    }

    const status = resultCode === "0" ? "completed" : "failed";
    const failureReason =
      resultCode !== "0" ? resultDesc || "Payment failed" : undefined;

    console.log(`💰 Payment ${status}: ${checkoutRequestId}`);
    console.log(`   Transaction ID: ${transactionId || "N/A"}`);
    console.log(`   Receipt: ${mpesaReceiptNumber || "N/A"}`);

    // Update payment status in Convex
    const { api } = await import("@convex/_generated/api");

    const result = await convex.mutation(
      api.payments.updatePaymentStatusFromCallback,
      {
        checkoutRequestId,
        status,
        transactionId: transactionId || undefined,
        amount: amount ? Number(amount) : undefined,
        phoneNumber: phoneNumber || undefined,
        mpesaReceiptNumber: mpesaReceiptNumber || undefined,
        failureReason,
      },
    );

    console.log(`✅ Webhook processed:`, result);

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

export async function GET() {
  return NextResponse.json(
    { message: "Webhook endpoint is active. Use POST for M-Pesa callbacks." },
    { status: 200 },
  );
}

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 });
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type");
  return response;
}
