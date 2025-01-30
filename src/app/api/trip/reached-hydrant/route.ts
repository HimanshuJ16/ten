import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const tripId = searchParams.get("id");

  if (!tripId) {
    return NextResponse.json({ success: false, error: "Missing trip ID" }, { status: 400 });
  }

  try {
    const { photoUrl } = await request.json();

    if (!photoUrl) {
      return NextResponse.json({ success: false, error: "Missing photo URL" }, { status: 400 });
    }

    const sql = neon(process.env.DATABASE_URL!);

    const result = await sql`
      UPDATE "Trip"
      SET status = 'pickup', photo = ${photoUrl}
      WHERE id = ${tripId}::uuid
      RETURNING id
    `;

    if (result.length === 0) {
      throw new Error("Failed to update trip status");
    }

    return NextResponse.json(
      {
        success: true,
        message: "Trip status updated successfully",
        tripId: result[0].id,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating trip status:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error", details: (error as Error).message },
      { status: 500 }
    );
  }
}
