import { neon } from "@neondatabase/serverless"
import { NextResponse } from "next/server"
import { calculateDistance } from "@/lib/distance"

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")

  if (!id) {
    return NextResponse.json({ success: false, error: "Missing trip ID" }, { status: 400 })
  }

  try {
    const { latitude, longitude, altitude, speed, heading } = await request.json()

    if (!latitude || !longitude) {
      return NextResponse.json({ success: false, error: "Missing required location data" }, { status: 400 })
    }

    const sql = neon(process.env.DATABASE_URL!)

    // Get the previous location
    const previousLocation = await sql`
      SELECT latitude, longitude
      FROM "GpsLocation"
      WHERE "tripId" = ${id}::uuid
      ORDER BY timestamp DESC
      LIMIT 1
    `

    let distanceTraveled = 0

    if (previousLocation.length > 0) {
      const { latitude: prevLat, longitude: prevLon } = previousLocation[0]
      distanceTraveled = calculateDistance(prevLat, prevLon, latitude, longitude)
    }

    // Insert new GPS location
    const result = await sql`
      INSERT INTO "GpsLocation" (
        "tripId",
        "latitude",
        "longitude",
        "altitude",
        "speed",
        "heading",
        "timestamp"
      ) VALUES (
        ${id}::uuid,
        ${latitude},
        ${longitude},
        ${altitude || null},
        ${speed || null},
        ${heading || null},
        NOW()
      ) RETURNING id
    `

    // Update trip distance
    await sql`
      UPDATE "Trip"
      SET distance = COALESCE(distance, 0) + ${distanceTraveled}
      WHERE id = ${id}::uuid
    `

    return NextResponse.json({
      success: true,
      message: "GPS location created and trip distance updated successfully",
      locationId: result[0].id,
      distanceTraveled,
    })
  } catch (error) {
    console.error("Error updating or inserting GPS location:", error)
    return NextResponse.json(
      { success: false, error: "Internal Server Error", details: (error as Error).message },
      { status: 500 },
    )
  }
}

