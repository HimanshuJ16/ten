import { neon } from "@neondatabase/serverless";
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  // Parse the `id` query parameter from the request URL
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ success: false, error: "Missing trip ID" }, { status: 400 });
  }

  try {
    const { latitude, longitude, altitude, speed, heading } = await request.json();
    
    if (!latitude || !longitude) {
      return NextResponse.json({ success: false, error: "Missing required location data" }, { status: 400 });
    }

    const sql = neon(process.env.DATABASE_URL!);

    const result = await sql`
      INSERT INTO "GpsLocation" (
        "latitude",
        "longitude",
        "altitude",
        "speed",
        "heading",
        "timestamp",
        "tripId"
      ) VALUES (
        ${latitude},
        ${longitude},
        ${altitude || null},
        ${speed || null},
        ${heading || null},
        NOW(),
        ${id}::uuid
      ) RETURNING id
    `;

    if (result.length === 0) {
      throw new Error("Failed to insert GPS location");
    }

    return NextResponse.json({
      success: true,
      message: 'GPS location updated successfully',
      locationId: result[0].id
    }, { status: 200 });

  } catch (error) {
    console.error("Error updating GPS location:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error", details: (error as Error).message },
      { status: 500 }
    );
  }
}