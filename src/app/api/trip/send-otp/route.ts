import { sendOtp } from '@/lib/otpService';
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { phoneNumber } = await request.json();

    if (!phoneNumber) {
      return NextResponse.json({ success: false, error: "Phone number is required" }, { status: 400 });
    }

    const otpResponse = await sendOtp(phoneNumber);

    if (!otpResponse.success) {
      return NextResponse.json({ success: false, error: otpResponse.error }, { status: 500 });
    }

    return NextResponse.json(
      {
        success: true,
        otpToken: otpResponse.otpToken,
        timestamp: otpResponse.timestamp,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in send-otp API:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error", details: (error as Error).message },
      { status: 500 }
    );
  }
}
