// import { neon } from "@neondatabase/serverless";
// import { NextResponse } from "next/server";
// import twilio from "twilio";

// const accountSid = process.env.TWILIO_ACCOUNT_SID;
// const authToken = process.env.TWILIO_AUTH_TOKEN;
// const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

// const client = twilio(accountSid, authToken);

// export async function POST(request: Request) {
//   const { searchParams } = new URL(request.url);
//   const tripId = searchParams.get("id");

//   if (!tripId) {
//     return NextResponse.json({ success: false, error: "Missing trip ID" }, { status: 400 });
//   }

//   try {
//     const sql = neon(process.env.DATABASE_URL!);

//     // Fetch trip details including customer contact number
//     const trip = await sql`
//       SELECT t.*, c."contactNumber"
//       FROM "Trip" t
//       JOIN "Booking" b ON t."bookingId" = b.id
//       JOIN "Customer" c ON b."customerId" = c.id
//       WHERE t.id = ${tripId}::uuid
//     `;

//     if (trip.length === 0) {
//       return NextResponse.json({ success: false, error: "Trip not found" }, { status: 404 });
//     }

//     const customerContactNumber = trip[0].contactNumber;

//     // Generate a 6-digit OTP
//     const otp = Math.floor(100000 + Math.random() * 900000).toString();
//     const otpToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
//     const otpTimestamp = Date.now();

//     // Save OTP details in the database
//     await sql`
//       UPDATE "Trip"
//       SET "otpToken" = ${otpToken}, "otpTimestamp" = ${otpTimestamp}
//       WHERE id = ${tripId}::uuid
//     `;

//     // Send OTP via Twilio
//     await client.messages.create({
//       body: `Your OTP for trip completion is: ${otp}`,
//       from: twilioPhoneNumber,
//       to: customerContactNumber,
//     });

//     return NextResponse.json(
//       {
//         success: true,
//         message: "OTP sent successfully",
//         otpToken,
//         timestamp: otpTimestamp,
//       },
//       { status: 200 }
//     );
//   } catch (error) {
//     console.error("Error sending OTP:", error);
//     return NextResponse.json(
//       { success: false, error: "Internal Server Error", details: (error as Error).message },
//       { status: 500 }
//     );
//   }
// }

import { sendOtp } from '@/lib/otpService';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { phoneNumber } = req.body;

  if (!phoneNumber) {
    return res.status(400).json({ success: false, error: 'Phone number is required' });
  }

  try {
    const otpResponse = await sendOtp(phoneNumber);

    if (!otpResponse.success) {
      return res.status(500).json({ success: false, error: otpResponse.error });
    }

    return res.status(200).json({
      success: true,
      otpToken: otpResponse.otpToken,
      timestamp: otpResponse.timestamp,
    });
  } catch (error) {
    console.error('Error in send-otp API:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}