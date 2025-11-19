import { NextResponse } from "next/server";
import { verifyOtp } from "@/lib/otpService";
import { client } from "@/lib/prisma";
import jwt from "jsonwebtoken";

export async function POST(request: Request) {
  try {
    // 1. We need vehicleId to know WHO is logging in
    const { verificationId, otp, vehicleId } = await request.json();

    if (!verificationId || !otp || !vehicleId) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // 2. Verify OTP with Message Central
    const otpResponse = await verifyOtp(verificationId, otp);

    if (!otpResponse.success) {
      return NextResponse.json(
        { success: false, error: otpResponse.error || "Invalid OTP" },
        { status: 400 }
      );
    }

    // 3. Fetch Vehicle from DB
    const vehicle = await client.vehicle.findUnique({
      where: { id: vehicleId },
    });

    if (!vehicle) {
       return NextResponse.json({ success: false, error: "Vehicle not found" }, { status: 404 });
    }

    // 4. Security Check: Match DB phone number with Verified phone number
    // We compare the last 10 digits to avoid format issues (+91 vs 91 vs 0)
    const dbNumber = vehicle.contactNumber?.replace(/\D/g, '').slice(-10);
    const verifiedNumber = otpResponse.mobileNumber?.replace(/\D/g, '').slice(-10);

    if (dbNumber !== verifiedNumber) {
        return NextResponse.json(
            { success: false, error: "Phone number does not match vehicle records" },
            { status: 403 }
        );
    }

    // 5. Generate JWT Token
    // This payload mimics your user session but for a "driver" role
    const token = jwt.sign(
      {
        id: vehicle.id,
        vehicleNumber: vehicle.vehicleNumber,
        role: "driver", 
        district: "unknown" // Vehicles might not have direct district field in payload if not needed
      },
      process.env.JWT_SECRET!, 
      { expiresIn: "7d" } // Mobile tokens usually last longer (e.g., 7 days)
    );

    return NextResponse.json({
      success: true,
      message: "Verification successful",
      mobileNumber: otpResponse.mobileNumber,
      token: token, // <--- The token is now returned
      vehicle: {
        id: vehicle.id,
        vehicleNumber: vehicle.vehicleNumber,
        name: vehicle.name
      }
    });

  } catch (error) {
    console.error("Error verifying OTP:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}