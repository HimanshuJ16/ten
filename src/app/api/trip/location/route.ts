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

    // Perform an upsert: Update if the record exists, otherwise insert a new record
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
      )
      ON CONFLICT ("tripId") 
      DO UPDATE SET 
        "latitude" = EXCLUDED."latitude",
        "longitude" = EXCLUDED."longitude",
        "altitude" = EXCLUDED."altitude",
        "speed" = EXCLUDED."speed",
        "heading" = EXCLUDED."heading",
        "timestamp" = EXCLUDED."timestamp"
      RETURNING id
    `;

    return NextResponse.json({
      success: true,
      message: result.length > 0 ? "GPS location updated successfully" : "GPS location created successfully",
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
