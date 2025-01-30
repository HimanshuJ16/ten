import { neon } from "@neondatabase/serverless";
import { randomUUID } from "crypto";
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
    const { action, vehicleId } = await request.json();
    if (!action) {
      console.error("Error: Missing action field");
      return NextResponse.json({ error: "Missing action" }, { status: 400 });
    }

    const sql = neon(`${process.env.DATABASE_URL}`);

    if (action === "accept") {
      if (!vehicleId) {
        console.error("Error: Missing vehicleId for accept action");
        return NextResponse.json({ error: "Missing vehicleId for accept action" }, { status: 400 });
      }

      const tripId = randomUUID();

      // Update booking status
      // console.log(`Updating booking status to 'accepted' for booking ID: ${id}`);
      // await sql`
      //   UPDATE "Booking"
      //   SET status = 'accepted'
      //   WHERE id = ${id}
      // `;

      // // Log if the booking status update is successful
      // console.log(`Booking status updated to 'accepted' for booking ID: ${id}`);

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
          'accepted',
          NULL,
          NULL,
          NOW(),
          NOW(),
          ${vehicleId},
          ${id}
        )
      `;

      console.log(`Trip created successfully with ID: ${tripId}`);

      return NextResponse.json({
        success: true,
        message: "Booking accepted and trip created",
        tripId: tripId,
      });
    }

    if (action === "reject") {
      console.log(`Rejecting booking with ID: ${id}`);
      await sql`
        UPDATE "Booking"
        SET status = 'rejected'
        WHERE id = ${id}
      `;
      console.log(`Booking rejected with ID: ${id}`);

      return NextResponse.json({
        success: true,
        message: "Booking rejected",
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
