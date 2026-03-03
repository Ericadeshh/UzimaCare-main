import { NextResponse } from "next/server";
import { fetchMutation } from "convex/nextjs";
import { api } from "@convex/_generated/api";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("M-Pesa STK Callback received:", body);

    // Process the callback in Convex
    await fetchMutation(api.payments.handleSTKCallback, {
      body: body.Body.stkCallback,
    });

    // Always respond with success to M-Pesa
    return NextResponse.json({
      ResultCode: 0,
      ResultDesc: "Success",
    });
  } catch (error) {
    console.error("Error processing M-Pesa callback:", error);

    // Even on error, respond with success to prevent M-Pesa from retrying
    return NextResponse.json({
      ResultCode: 0,
      ResultDesc: "Success",
    });
  }
}

export async function GET() {
  return NextResponse.json({ message: "M-Pesa callback endpoint ready" });
}
