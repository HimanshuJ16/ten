"use server"

import { client } from "@/lib/prisma"
import { startOfDay, endOfDay } from "date-fns"
import { cookies } from "next/headers"
import { verify } from "jsonwebtoken"

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

    const dbUser = await client.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, district: true, username: true, role: true },
    })

    return dbUser
  } catch (error) {
    console.error("Error verifying token:", error)
    return null
  }
}

export const getDashboardData = async (startDate?: Date, endDate?: Date) => {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) return { status: 401, message: "Unauthorized" }

    const start = startDate ? startOfDay(startDate) : startOfDay(new Date())
    const end = endDate ? endOfDay(endDate) : endOfDay(new Date())

    let whereClause = {}
    let bookingWhereClause = {}
    let vehicleWhereClause = {}

    switch (currentUser.role) {
      case "contractor":
        whereClause = {
          booking: {
            jen: {
              contractor: {
                username: currentUser.username,
              },
            },
          },
        }
        bookingWhereClause = {
          jen: {
            contractor: {
              username: currentUser.username,
            },
          },
        }
        vehicleWhereClause = {
          jen: {
            contractor: {
              username: currentUser.username,
            },
          },
        }
        break

      case "aen":
        whereClause = {
          booking: {
            jen: {
              aen: {
                username: currentUser.username,
              },
            },
          },
        }
        bookingWhereClause = {
          jen: {
            aen: {
              username: currentUser.username,
            },
          },
        }
        vehicleWhereClause = {
          jen: {
            aen: {
              username: currentUser.username,
            },
          },
        }
        break

      case "jen":
        whereClause = {
          booking: {
            jen: { username: currentUser.username },
          },
        }
        bookingWhereClause = {
          jen: { username: currentUser.username },
        }
        vehicleWhereClause = {
          jen: { username: currentUser.username },
        }
        break

      case "vendor":
        whereClause = {
          booking: {
            vendor: { username: currentUser.username },
          },
        }
        bookingWhereClause = {
          vendor: { username: currentUser.username },
        }
        vehicleWhereClause = {
          vendor: { username: currentUser.username },
        }
        break

      case "admin":
        // No additional where clause for admin
        break

      default:
        return { status: 403, message: "Unauthorized role" }
    }

    const [
      totalBookings,
      tripsAccepted,
      tripsReachedHydrant,
      tripsOngoing,
      tripsCompleted,
      tripsRejected,
      totalVehicles,
      tripsDelivered,
      dailyTripStats,
    ] = await Promise.all([
      client.booking.count({
        where: {
          createdAt: { gte: start, lte: end },
          ...bookingWhereClause,
        },
      }),
      client.trip.count({
        where: {
          createdAt: { gte: start, lte: end },
          status: "accepted",
          ...whereClause,
        },
      }),
      client.trip.count({
        where: {
          startTime: { gte: start, lte: end },
          status: "pickup",
          ...whereClause,
        },
      }),
      client.trip.count({
        where: {
          startTime: { gte: start, lte: end },
          status: "ongoing",
          ...whereClause,
        },
      }),
      client.trip.count({
        where: {
          endTime: { gte: start, lte: end },
          status: "completed",
          ...whereClause,
        },
      }),
      client.trip.count({
        where: {
          createdAt: { gte: start, lte: end },
          status: "rejected",
          ...whereClause,
        },
      }),
      client.vehicle.count({
        where: vehicleWhereClause,
      }),
      client.trip.count({
        where: {
          startTime: { gte: start, lte: end },
          status: "delivered",
          ...whereClause,
        },
      }),
      client.trip.groupBy({
        by: ["startTime"],
        where: {
          startTime: { gte: start, lte: end },
          ...whereClause,
        },
        _count: true,
        orderBy: { startTime: "asc" },
      }),
    ])

    const dailyTripData = dailyTripStats.map((item) => ({
      date: item.startTime?.toISOString().split("T")[0],
      trips: item._count,
    }))

    return {
      status: 200,
      data: {
        totalBookings,
        tripsAccepted,
        tripsReachedHydrant,
        tripsOngoing,
        tripsCompleted,
        tripsRejected,
        totalVehicles,
        tripsDelivered,
        dailyTripStats: dailyTripData,
      },
    }
  } catch (error) {
    console.error("Error fetching dashboard data:", error)
    if (error instanceof Error) {
      return { status: 500, message: `Internal server error: ${error.message}` }
    }
    return { status: 500, message: "Internal server error" }
  }
}