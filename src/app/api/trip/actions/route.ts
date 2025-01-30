import { neon } from "@neondatabase/serverless";
import { randomUUID } from "crypto";
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    console.error("Error: Missing required fields");
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    const { action, vehicleId } = await request.json();
    if (!action) {
      console.error("Error: Missing action field");
      return NextResponse.json({ error: "Missing action" }, { status: 400 });
    }

    const sql = neon(`${process.env.DATABASE_URL}`);

    if (action === "accept" || action === "reject") {
      if (!vehicleId) {
        console.error("Error: Missing vehicleId for action");
        return NextResponse.json({ error: "Missing vehicleId for action" }, { status: 400 });
      }

      const tripId = randomUUID();
      const tripStatus = action === "accept" ? "accepted" : "rejected";

      // Create new trip
      console.log(`Creating a new trip with ID: ${tripId} for vehicle ID: ${vehicleId} and booking ID: ${id}`);
      await sql`
        INSERT INTO "Trip" (
          "id",
          "startTime",
          "endTime",
          "distance",
          "status",
          "photo",
          "video",
          "createdAt",
          "updatedAt",
          "vehicleId",
          "bookingId"
        )
        VALUES (
          ${tripId},
          NULL,
          NULL,
          NULL,
          ${tripStatus},
          NULL,
          NULL,
          NOW(),
          NOW(),
          ${vehicleId},
          ${id}
        )
      `;

      console.log(`Trip created successfully with ID: ${tripId} and status: ${tripStatus}`);

      return NextResponse.json({
        success: true,
        message: `Booking ${tripStatus} and trip created`,
        tripId: tripId,
      });
    }

    console.error("Error: Invalid action provided");
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error processing booking action:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: (error as Error).message },
      { status: 500 }
    );
  }
}