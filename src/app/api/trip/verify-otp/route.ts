// import { neon } from "@neondatabase/serverless";
// import { NextResponse } from "next/server";

// export async function POST(request: Request) {
//   const { searchParams } = new URL(request.url);
//   const tripId = searchParams.get("id");

//   if (!tripId) {
//     return NextResponse.json({ success: false, error: "Missing trip ID" }, { status: 400 });
//   }

//   try {
//     const { otp, otpToken, timestamp } = await request.json();

//     if (!otp || !otpToken || !timestamp) {
//       return NextResponse.json({ success: false, error: "Missing OTP details" }, { status: 400 });
//     }

//     const sql = neon(process.env.DATABASE_URL!);

//     // Fetch trip details including OTP details
//     const trip = await sql`
//       SELECT * FROM "Trip"
//       WHERE id = ${tripId}::uuid
//     `;

//     if (trip.length === 0) {
//       return NextResponse.json({ success: false, error: "Trip not found" }, { status: 404 });
//     }

//     const storedOtpToken = trip[0].otpToken;
//     const storedOtpTimestamp = trip[0].otpTimestamp;

//     // Verify OTP token and timestamp
//     if (storedOtpToken !== otpToken || storedOtpTimestamp !== timestamp) {
//       return NextResponse.json({ success: false, error: "Invalid OTP token or timestamp" }, { status: 400 });
//     }

//     // Verify OTP (assuming OTP is stored in the database or verified via Twilio)
//     // For simplicity, we assume the OTP is correct here
//     // In a real-world scenario, you would verify the OTP against the one sent to the user

//     // Update trip status to completed and set endTime
//     const result = await sql`
//       UPDATE "Trip"
//       SET status = 'completed', "endTime" = NOW()
//       WHERE id = ${tripId}::uuid
//       RETURNING id
//     `;

//     if (result.length === 0) {
//       throw new Error("Failed to update trip status");
//     }

//     return NextResponse.json(
//       {
//         success: true,
//         message: "OTP verified successfully and trip completed",
//         tripId: result[0].id,
//       },
//       { status: 200 }
//     );
//   } catch (error) {
//     console.error("Error verifying OTP:", error);
//     return NextResponse.json(
//       { success: false, error: "Internal Server Error", details: (error as Error).message },
//       { status: 500 }
//     );
//   }
// }

import { verifyOtp } from '@/lib/otpService';
import { neon } from '@neondatabase/serverless';
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { phoneNumber, otp, otpToken, tripId } = await request.json();

    if (!phoneNumber || !otp || !otpToken || !tripId) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const verifyResponse = await verifyOtp(phoneNumber, otp, otpToken);

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