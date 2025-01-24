import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

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

    // Step 1: Check if a record with the given tripId exists
    const existingRecord = await sql`
      SELECT id FROM "GpsLocation" WHERE "tripId" = ${id}::uuid
    `;

    let result;

    if (existingRecord.length > 0) {
      // Step 2: If record exists, update it
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
      // Step 3: If no record exists, insert a new one
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

    return NextResponse.json({
      success: true,
      message: existingRecord.length > 0 ? "GPS location updated successfully" : "GPS location created successfully",
      locationId: result[0].id,
    });
  } catch (error) {
    console.error("Error updating or inserting GPS location:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error", details: (error as Error).message },
      { status: 500 }
    );
  }
}
