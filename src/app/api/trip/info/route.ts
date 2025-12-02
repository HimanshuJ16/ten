import { neon } from "@neondatabase/serverless";
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // Parse the `id` query parameter from the request URL
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    console.error("Error: Missing required fields");
    return new NextResponse(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
  }

  try {
    const sql = neon(process.env.DATABASE_URL!);

    const response = await sql`
      SELECT 
        t.id as "tripId",
        t.status as "tripStatus",
        t."startTime",
        t."endTime",
        t."photo",
        t."video",
        t.distance,
        b.id as "bookingId",
        b."readableId" as "readableId",
        b."scheduledDateTime" as "journeyDate",
        b.status as "bookingStatus",
        h.name as "hydrantName",
        h.address as "hydrantAddress",
        h.latitude as "hydrantLatitude",
        h.longitude as "hydrantLongitude",
        d.name as "destinationName",
        d.address as "destinationAddress",
        d.latitude as "destinationLatitude",
        d.longitude as "destinationLongitude",
        c.name as "customerName",
        c."contactNumber" as "customerContact",
        c.address as "customerAddress"
      FROM "Trip" t
      LEFT JOIN "Booking" b ON t."bookingId" = b.id
      LEFT JOIN "Hydrant" h ON b."hydrantId" = h.id
      LEFT JOIN "Customer" c ON b."customerId" = c.id
      LEFT JOIN "Destination" d ON b."destinationId" = d.id
      WHERE t.id = ${id}::uuid
    `;

    if (response.length === 0) {
      return new NextResponse(JSON.stringify({ error: "Trip not found" }), { status: 404 });
    }

    const trip = response[0];
    const formattedTrip = {
      tripId: trip.tripId,
      status: trip.tripStatus,
      startTime: trip.startTime,
      endTime: trip.endTime,
      distance: trip.distance,
      photo: trip.photo,
      video: trip.video,
      booking: {
        id: trip.bookingId,
        readableId: trip.readableId,
        journeyDate: trip.journeyDate ? new Date(trip.journeyDate).toISOString() : null,
        status: trip.bookingStatus
      },
      hydrant: {
        name: trip.hydrantName,
        address: trip.hydrantAddress,
        latitude: trip.hydrantLatitude,
        longitude: trip.hydrantLongitude
      },
      destination: {
        name: trip.destinationName,
        address: trip.destinationAddress,
        latitude: trip.destinationLatitude,
        longitude: trip.destinationLongitude
      },
      customer: {
        name: trip.customerName,
        contactNumber: trip.customerContact,
        address: trip.customerAddress
      }
    };

    return new NextResponse(
      JSON.stringify({ success: true, trip: formattedTrip }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error fetching trip details:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal Server Error", details: (error as Error).message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
