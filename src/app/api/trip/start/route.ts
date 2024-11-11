import { neon } from "@neondatabase/serverless";
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  // Parse the `id` query parameter from the request URL
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    console.error("Error: Missing required fields");
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    const sql = neon(process.env.DATABASE_URL!);

    // Update trip start time and status
    const result = await sql`
      UPDATE "Trip"
      SET "startTime" = NOW(),
          "status" = 'ongoing',
          "updatedAt" = NOW()
      WHERE "id" = ${id}
      RETURNING "id", "startTime", "status"
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    const updatedTrip = result[0];

    return NextResponse.json({
      success: true,
      message: 'Trip started successfully',
      trip: {
        id: updatedTrip.id,
        startTime: updatedTrip.startTime,
        status: updatedTrip.status
      }
    }, { status: 200 });

  } catch (error) {
    console.error("Error starting trip:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: (error as Error).message },
      { status: 500 }
    );
  }
}