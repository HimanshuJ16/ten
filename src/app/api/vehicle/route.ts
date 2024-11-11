import { neon } from "@neondatabase/serverless";
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const { vehicleNumber } = await request.json();

    if (!vehicleNumber) {
      return NextResponse.json(
        { error: "Missing vehicle number" },
        { status: 400 },
      );
    }

    console.log(`Checking for vehicle number: ${vehicleNumber}`);

    const response = await sql`
      SELECT id, "contactNumber"
      FROM "Vehicle"
      WHERE "vehicleNumber" = ${vehicleNumber};
    `;

    console.log(`Database response:`, response);

    if (response.length === 0) {
      return NextResponse.json(
        { exists: false, error: "Vehicle not found" },
        { status: 404 },
      );
    }

    const vehicle = response[0];

    return new NextResponse(JSON.stringify({
      exists: true,
      contactNumber: vehicle.contactNumber,
      vehicleId: vehicle.id
    }), {
      status: 200,
    });
  } catch (error) {
    console.error("Error checking vehicle:", error);
    return NextResponse.json({ error: "Internal Server Error", details: (error as Error).message }, { status: 500 });
  }
}