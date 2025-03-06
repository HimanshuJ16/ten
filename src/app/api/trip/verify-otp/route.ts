import { verifyOtp } from '@/lib/otpService';
import { neon } from '@neondatabase/serverless';
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { verificationId, otp, tripId } = await request.json();

    if (!verificationId || !otp || !tripId) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const verifyResponse = await verifyOtp(verificationId, otp);

    if (!verifyResponse.success) {
      return NextResponse.json({ success: false, error: verifyResponse.error }, { status: 400 });
    }

    // Update trip status to "completed" and set endTime
    const sql = neon(process.env.DATABASE_URL!);
    const updatedTrip = await sql`
      UPDATE "Trip"
      SET status = 'completed', "endTime" = NOW()
      WHERE id = ${tripId}::uuid
      RETURNING id
    `;

    if (updatedTrip.length === 0) {
      throw new Error("Failed to update trip status");
    }

    return NextResponse.json(
      {
        success: true,
        message: "OTP verified and trip completed successfully",
        tripId: updatedTrip[0].id,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in verify-otp API:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error", details: (error as Error).message },
      { status: 500 }
    );
  }
}