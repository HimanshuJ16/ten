import { calculateDistance } from "@/lib/distance"
import { neon } from "@neondatabase/serverless"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url)
  const tripId = searchParams.get("id")

  if (!tripId) {
    return NextResponse.json({ success: false, error: "Missing trip ID" }, { status: 400 })
  }

  try {
    const { videoUrl } = await request.json()

    if (!videoUrl) {
      return NextResponse.json({ success: false, error: "Missing video URL" }, { status: 400 })
    }

    const sql = neon(process.env.DATABASE_URL!)

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

    const result = await sql`
      UPDATE "Trip"
      SET status = 'delivered', video = ${videoUrl}, "endTime" = NOW(), distance = ${finalTotalDistance}
      WHERE id = ${tripId}::uuid
      RETURNING id
    `

    if (result.length === 0) {
      throw new Error("Failed to update trip with water supply video")
    }

    return NextResponse.json(
      {
        success: true,
        message: "Water supply video uploaded successfully",
        tripId: result[0].id,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error updating trip with video:", error)
    return NextResponse.json(
      { success: false, error: "Internal Server Error", details: (error as Error).message },
      { status: 500 },
    )
  }
}

