import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("M-Pesa Confirmation received:", body);

    // Process confirmation if needed

    return NextResponse.json({
      ResultCode: 0,
      ResultDesc: "Success",
    });
  } catch (error) {
    console.error("Error processing confirmation:", error);
    return NextResponse.json({
      ResultCode: 0,
      ResultDesc: "Success",
    });
  }
}
