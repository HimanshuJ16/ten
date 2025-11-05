import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";
import { verifyOtp } from "@/lib/otpService";
import { calculateDistance } from "@/lib/distance"; // <-- Import the distance calculator

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
      
      // --- NEW: RECALCULATE FINAL DISTANCE ---
      // 1. Fetch all location points for the trip, in order
      const allLocations = await sql`
        SELECT latitude, longitude 
        FROM "GpsLocation"
        WHERE "tripId" = ${tripId}::uuid
        ORDER BY "timestamp" ASC
      `;

      // 2. Calculate the total distance by summing the path
      let finalTotalDistance = 0;
      if (allLocations.length > 1) {
        for (let i = 0; i < allLocations.length - 1; i++) {
          const pointA = allLocations[i];
          const pointB = allLocations[i + 1];
          finalTotalDistance += calculateDistance(
            pointA.latitude,
            pointA.longitude,
            pointB.latitude,
            pointB.longitude
          );
        }
      }
      console.log(`Final distance for trip ${tripId}: ${finalTotalDistance} km`);
      // --- END OF NEW LOGIC ---


      // 3. Update the trip with final status, end time, AND final distance
      await sql`
        UPDATE "Trip"
        SET 
          status = 'COMPLETED', 
          "endTime" = NOW(),
          distance = ${finalTotalDistance} -- Overwrite with the final, accurate distance
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