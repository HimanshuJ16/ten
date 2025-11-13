import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";
import { verifyOtp } from "@/lib/otpService";

export async function POST(request: Request) {
  try {
    const { verificationId, otp, tripId } = await request.json();

    if (!verificationId || !otp || !tripId) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const isOtpValid = await verifyOtp(verificationId, otp);
    const sql = neon(process.env.DATABASE_URL!);

    if (isOtpValid) {
      await sql`
        UPDATE "Trip"
        SET status = 'completed'
        WHERE id = ${tripId}::uuid
      `;

      return NextResponse.json({
        success: true,
        message: "OTP verified and trip completed successfully",
      });
    } else {
      return NextResponse.json(
        { success: false, error: "Invalid or expired OTP" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}