import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";
import { calculateDistance } from "@/lib/distance";

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ success: false, error: "Missing trip ID" }, { status: 400 });
  }

  try {
    const { latitude, longitude, altitude, speed, heading } = await request.json();

    if (!latitude || !longitude) {
      return NextResponse.json(
        { success: false, error: "Missing required location data" },
        { status: 400 }
      );
    }

    const sql = neon(process.env.DATABASE_URL!);

    // Get the existing GPS location for this trip
    const existingLocation = await sql`
      SELECT id, latitude, longitude
      FROM "GpsLocation"
      WHERE "tripId" = ${id}::uuid
    `;

    let distanceTraveled = 0;
    let result;

    if (existingLocation.length > 0) {
      // Calculate distance from previous location
      const { latitude: prevLat, longitude: prevLon } = existingLocation[0];
      distanceTraveled = calculateDistance(prevLat, prevLon, latitude, longitude);

      // Update existing GPS location
      result = await sql`
        UPDATE "GpsLocation"
        SET
          "latitude" = ${latitude},
          "longitude" = ${longitude},
          "altitude" = ${altitude || null},
          "speed" = ${speed || null},
          "heading" = ${heading || null},
          "timestamp" = NOW()
        WHERE "tripId" = ${id}::uuid
        RETURNING id
      `;
    } else {
      // Insert new GPS location if it doesn't exist
      result = await sql`
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
      `;
    }

    // Update trip distance
    await sql`
      UPDATE "Trip"
      SET distance = COALESCE(distance, 0) + ${distanceTraveled}
      WHERE id = ${id}::uuid
    `;

    return NextResponse.json({
      success: true,
      message: existingLocation.length > 0 ? "GPS location updated successfully" : "GPS location created successfully",
      locationId: result[0].id,
      distanceTraveled,
    });
  } catch (error) {
    console.error("Error updating GPS location:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error", details: (error as Error).message },
      { status: 500 }
    );
  }
}
