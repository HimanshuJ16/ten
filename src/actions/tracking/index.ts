"use server"

import { PrismaClient } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { verify } from "jsonwebtoken"

const prisma = new PrismaClient()

interface JwtPayload {
  userId: string
  username: string
  role: string
}

async function getCurrentUser() {
  const cookieStore = cookies()
  const token = (await cookieStore).get("token")?.value

  if (!token) return null

  try {
    const decoded = verify(token, process.env.JWT_SECRET!) as JwtPayload

    const dbUser = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, username: true, role: true },
    })

    return dbUser
  } catch (error) {
    console.error("Error verifying token:", error)
    return null
  }
}

export const getActiveBookings = async () => {
  const currentUser = await getCurrentUser()
  if (!currentUser) return { status: 401, message: "Unauthorized" }

  try {
    const bookings = await prisma.booking.findMany({
      where: {
        trip: {
          some: {
            status: {
              in: ["ongoing", "pickup"],
            },
          },
        },
      },
      include: {
        vehicle: true,
        customer: true,
      },
    })

    return {
      status: 200,
      data: bookings.map((booking) => ({
        ...booking,
        vehicleNumber: booking.vehicle?.vehicleNumber,
        customerName: booking.customer?.name,
      })),
    }
  } catch (error) {
    console.error("Error fetching active bookings:", error)
    return { status: 500, message: "Internal server error" }
  }
}

export const getTrackingData = async (bookingId: string) => {
  const currentUser = await getCurrentUser()
  if (!currentUser) return { status: 401, message: "Unauthorized" }

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        vehicle: true,
        trip: {
          where: {
            status: {
              in: ["ongoing", "pickup", "delivered"],
            },
          },
          include: {
            gpsLocations: {
              orderBy: {
                timestamp: "desc",
              },
              take: 1,
            },
          },
        },
      },
    })

    if (!booking) {
      return { status: 404, message: "Booking not found" }
    }

    if (!booking.trip || booking.trip.length === 0) {
      return { status: 404, message: "No active trip found for this booking" }
    }

    const trackingData = {
      bookingId: booking.id,
      vehicleNumber: booking.vehicle?.vehicleNumber,
      driverContactNumber: booking.vehicle?.contactNumber,
      currentLocation: booking.trip[0].gpsLocations[0] || null,
      tripStatus: booking.trip[0].status,
    }

    return { status: 200, data: trackingData }
  } catch (error) {
    console.error("Error fetching tracking data:", error)
    return { status: 500, message: "Internal server error" }
  }
}

export const startTracking = async (bookingId: string) => {
  const currentUser = await getCurrentUser()
  if (!currentUser) return { status: 401, message: "Unauthorized" }

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { trip: true, vehicle: true },
    })

    if (!booking) {
      return { status: 404, message: "Booking not found" }
    }

    if (booking.trip && booking.trip.length > 0) {
      return { status: 400, message: "Trip already started for this booking" }
    }

    revalidatePath("/tracking")
    return { status: 200, message: "Tracking started successfully" }
  } catch (error) {
    console.error("Error starting tracking:", error)
    return { status: 500, message: "Internal server error" }
  }
}

export const stopTracking = async (bookingId: string) => {
  const currentUser = await getCurrentUser()
  if (!currentUser) return { status: 401, message: "Unauthorized" }

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { trip: true },
    })

    if (!booking || !booking.trip || booking.trip.length === 0) {
      return { status: 404, message: "No active trip found for this booking" }
    }

    revalidatePath("/tracking")
    return { status: 200, message: "Tracking stopped successfully" }
  } catch (error) {
    console.error("Error stopping tracking:", error)
    return { status: 500, message: "Internal server error" }
  }
}

export const getVehicleNumber = async (vehicleId: string) => {
  try {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
      select: { vehicleNumber: true },
    })

    if (!vehicle) {
      return { status: 404, message: "No vehicle found" }
    }

    return { status: 200, data: vehicle.vehicleNumber }
  } catch (error) {
    console.error("Error fetching vehicle number:", error)
    return { status: 500, message: "Internal server error" }
  }
}


