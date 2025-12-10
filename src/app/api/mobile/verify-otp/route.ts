import { NextResponse } from 'next/server'
import { client } from '@/lib/prisma'
import { verifyOtp } from '@/lib/otpService'

export async function POST(request: Request) {
  try {
    const { verificationId, otp, tripId } = await request.json()

    if (!otp || !tripId) {
      return NextResponse.json(
        { success: false, error: "Missing required fields (otp or tripId)" },
        { status: 400 }
      );
    }

    // 1. Fetch the OTP stored in the database for this trip
    const trip = await client.trip.findUnique({
      where: { id: tripId },
      select: { otp: true }
    })

    const dbOtp = trip ? trip.otp : null;

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
      await client.trip.update({
        where: { id: tripId },
        data: {
          status: 'completed',
          otp: null
        }
      })

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
    console.error('Mobile Verify OTP error:', error)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}
