import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";
import { verifyOtp } from "@/lib/otpService";

export async function POST(request: Request) {
  try {
    const { verificationId, otp, tripId } = await request.json();
    const sql = neon(process.env.DATABASE_URL!);

    // verificationId is optional now to allow fallback to DB-only verification
    if (!otp || !tripId) {
      return NextResponse.json(
        { success: false, error: "Missing required fields (otp or tripId)" },
        { status: 400 }
      );
    }

    // 1. Fetch the OTP stored in the database for this trip
    const tripResult = await sql`
      SELECT otp FROM "Trip" 
      WHERE id = ${tripId}::uuid
    `;
    const dbOtp = tripResult.length > 0 ? tripResult[0].otp : null;

    // 2. Attempt External Verification (if verificationId is present)
    let isExternalValid = false;
    if (verificationId) {
      try {
        const response = await verifyOtp(verificationId, otp);
        // Check the .success property of the response object
        isExternalValid = response.success; 
      } catch (error) {
        console.error("External verifyOtp failed:", error);
        // Continue to check DB OTP even if external service errors out
      }
    }

    // 3. Success Condition: Either External is valid OR Database OTP matches
    if (isExternalValid || (dbOtp && dbOtp === otp)) {
      // Mark trip as completed and clear OTP fields
      await sql`
        UPDATE "Trip"
        SET status = 'completed', otp = NULL
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