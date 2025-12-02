"use server"

import { PrismaClient } from "@prisma/client"
import { cookies } from "next/headers"
import { format, formatDistanceStrict } from "date-fns"
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
      select: {
        id: true,
        username: true,
        role: true,
      },
    })
    return dbUser
  } catch (error) {
    console.error("Error verifying token:", error)
    return null
  }
}

export const getVendors = async () => {
  const currentUser = await getCurrentUser()
  if (!currentUser) return { status: 401, message: "Unauthorized" }

  try {
    let vendors: { id: string; username: string }[]

    switch (currentUser.role) {
      case "contractor":
        vendors = await prisma.vendor.findMany({
          where: {
            jen: {
              contractor: {
                username: currentUser.username,
              },
            },
          },
          select: {
            id: true,
            username: true,
          },
          orderBy: {
            username: "asc",
          },
        })
        break
      
      case "se":
        vendors = await prisma.vendor.findMany({
          where: {
            jen: {
              aen: {
                xen: {
                  se: {
                    username: currentUser.username,
                  },
                },
              },
            },
          },
          select: {
            id: true,
            username: true,
          },
          orderBy: {
            username: "asc",
          },
        })
        break

      case "xen":
        vendors = await prisma.vendor.findMany({
          where: {
            jen: {
              aen: {
                xen: {
                  username: currentUser.username,
                },
              },
            },
          },
          select: {
            id: true,
            username: true,
          },
          orderBy: {
            username: "asc",
          },
        })
        break

      case "aen":
        // Get all vendors under all JENs managed by the AEN
        vendors = await prisma.vendor.findMany({
          where: {
            jen: {
              aen: {
                username: currentUser.username,
              },
            },
          },
          select: {
            id: true,
            username: true,
          },
          orderBy: {
            username: "asc",
          },
        })
        break

      case "jen":
        // Get all vendors under the JEN
        vendors = await prisma.vendor.findMany({
          where: {
            jen: {
              username: currentUser.username,
            },
          },
          select: {
            id: true,
            username: true,
          },
          orderBy: {
            username: "asc",
          },
        })
        break

      case "vendor":
        // Vendors don't need to see other vendors, so return an empty array
        vendors = []
        break

      default:
        // For other roles, return all vendors (or handle accordingly)
        vendors = await prisma.vendor.findMany({
          select: {
            id: true,
            username: true,
          },
          orderBy: {
            username: "asc",
          },
        })
        break
    }

    return {
      status: 200,
      data: vendors,
    }
  } catch (error) {
    console.error("Error fetching vendors:", error)
    return { status: 500, message: "Internal server error" }
  }
}

export const getTripsReport = async (startDate?: Date, endDate?: Date, vendorId?: string) => {
  const currentUser = await getCurrentUser()
  if (!currentUser) return { status: 401, message: "Unauthorized" }

  try {
    let trips

    switch (currentUser.role) {
      case 'contractor':
        trips = await prisma.trip.findMany({
          where: {
            startTime: {
              gte: startDate,
              lte: endDate,
            },
            booking: {
              status: "approved", // Only include trips with approved booking status
            },
            vehicle: {
              vendor: {
                jen: {
                  contractor: {
                    username: currentUser.username
                  }
                },
              },
            },
          },
          include: {
            vehicle: {
              include: {
                vendor: true,
              },
            },
            booking: true, // Include booking to check status
          },
          orderBy: { startTime: "desc" },
        })
        break

      case "se":
        trips = await prisma.trip.findMany({
          where: {
            startTime: {
              gte: startDate,
              lte: endDate,
            },
            booking: {
              status: "approved", // Only include trips with approved booking status
            },
            vehicle: {
              vendor: {
                jen: {
                  aen: {
                    xen: {
                      se: {
                        username: currentUser.username,
                      },
                    },
                  },
                },
              },
            },
          },
          include: {
            vehicle: {
              include: {
                vendor: true,
              },
            },
            booking: true, // Include booking to check status
          },
          orderBy: { startTime: "desc" },
        })
        break

      case "xen":
        trips = await prisma.trip.findMany({
          where: {
            startTime: {
              gte: startDate,
              lte: endDate,
            },
            booking: {
              status: "approved", // Only include trips with approved booking status
            },
            vehicle: {
              vendor: {
                jen: {
                  aen: {
                    xen: {
                      username: currentUser.username,
                    },
                  },
                },
              },
            },
          },
          include: {
            vehicle: {
              include: {
                vendor: true,
              },
            },
            booking: true, // Include booking to check status
          },
          orderBy: { startTime: "desc" },
        })
        break

      case "aen":
        trips = await prisma.trip.findMany({
          where: {
            startTime: {
              gte: startDate,
              lte: endDate,
            },
            booking: {
              status: "approved", // Only include trips with approved booking status
            },
            vehicle: {
              vendor: {
                jen: {
                  aen: {
                    username: currentUser.username,
                  },
                },
              },
            },
          },
          include: {
            vehicle: {
              include: {
                vendor: true,
              },
            },
            booking: true, // Include booking to check status
          },
          orderBy: { startTime: "desc" },
        })
        break

      case "jen":
        trips = await prisma.trip.findMany({
          where: {
            startTime: {
              gte: startDate,
              lte: endDate,
            },
            booking: {
              status: "approved", // Only include trips with approved booking status
            },
            vehicle: {
              vendor: {
                jen: {
                  username: currentUser.username,
                },
              },
            },
          },
          include: {
            vehicle: {
              include: {
                vendor: true,
              },
            },
            booking: true, // Include booking to check status
          },
          orderBy: { startTime: "desc" },
        })
        break

      case "vendor":
        trips = await prisma.trip.findMany({
          where: {
            startTime: {
              gte: startDate,
              lte: endDate,
            },
            booking: {
              status: "approved", // Only include trips with approved booking status
            },
            vehicle: {
              vendor: {
                username: currentUser.username,
              },
            },
          },
          include: {
            vehicle: {
              include: {
                vendor: true,
              },
            },
            booking: true, // Include booking to check status
          },
          orderBy: { startTime: "desc" },
        })
        break

      default:
        trips = await prisma.trip.findMany({
          where: {
            startTime: {
              gte: startDate,
              lte: endDate,
            },
            booking: {
              status: "approved", // Only include trips with approved booking status
            },
          },
          include: {
            vehicle: {
              include: {
                vendor: true,
              },
            },
            booking: true, // Include booking to check status
          },
          orderBy: { startTime: "desc" },
        })
        break
    }

    if (vendorId && vendorId !== "all") {
      trips = trips.filter((trip) => trip.vehicle.vendorId === vendorId)
    }

    // Aggregate trips by vehicle and vendor
    const aggregatedData = trips.reduce(
      (acc, trip) => {
        const key = `${trip.vehicle.vendor?.username || "N/A"}-${trip.vehicle.vehicleNumber}`

        if (!acc[key]) {
          acc[key] = {
            username: trip.vehicle.vendor?.username || "N/A",
            vehicleNumber: trip.vehicle.vehicleNumber,
            totalTrips: 0,
            totalDistance: 0,
          }
        }

        acc[key].totalTrips += 1
        acc[key].totalDistance += trip.distance || 0

        return acc
      },
      {} as Record<string, any>,
    )

    const reportData = Object.values(aggregatedData)

    return {
      status: 200,
      data: reportData,
    }
  } catch (error) {
    console.error("Error fetching trips report:", error)
    return { status: 500, message: "Internal server error" }
  }
}

// ADD THIS NEW FUNCTION
export const getBookingsReport = async (startDate?: Date, endDate?: Date, vendorId?: string) => {
  const currentUser = await getCurrentUser()
  if (!currentUser) return { status: 401, message: "Unauthorized" }

  try {
    let trips

    const includeQuery = {
      vehicle: {
        include: {
          vendor: true, // For Vendor Name
        },
      },
      booking: {
        include: {
          hydrant: true, // For Hydrant Name
          destination: true, // For Destination Name
          customer: true, // For Customer Name & Phone
        },
      },
    }

    switch (currentUser.role) {
      case 'contractor':
        trips = await prisma.trip.findMany({
          where: {
            startTime: { gte: startDate, lte: endDate },
            booking: { status: "approved" },
            vehicle: { vendor: { jen: { contractor: { username: currentUser.username } } } },
          },
          include: includeQuery,
          orderBy: { startTime: "desc" },
        })
        break

      case "se":
        trips = await prisma.trip.findMany({
          where: {
            startTime: { gte: startDate, lte: endDate },
            booking: { status: "approved" },
            vehicle: { vendor: { jen: { aen: { xen: { se: { username: currentUser.username } } } } } },
          },
          include: includeQuery,
          orderBy: { startTime: "desc" },
        })
        break

      case "xen":
        trips = await prisma.trip.findMany({
          where: {
            startTime: { gte: startDate, lte: endDate },
            booking: { status: "approved" },
            vehicle: { vendor: { jen: { aen: { xen: { username: currentUser.username } } } } },
          },
          include: includeQuery,
          orderBy: { startTime: "desc" },
        })
        break

      case "aen":
        trips = await prisma.trip.findMany({
          where: {
            startTime: { gte: startDate, lte: endDate },
            booking: { status: "approved" },
            vehicle: { vendor: { jen: { aen: { username: currentUser.username } } } },
          },
          include: includeQuery,
          orderBy: { startTime: "desc" },
        })
        break

      case "jen":
        trips = await prisma.trip.findMany({
          where: {
            startTime: { gte: startDate, lte: endDate },
            booking: { status: "approved" },
            vehicle: { vendor: { jen: { username: currentUser.username } } },
          },
          include: includeQuery,
          orderBy: { startTime: "desc" },
        })
        break

      case "vendor":
        trips = await prisma.trip.findMany({
          where: {
            startTime: { gte: startDate, lte: endDate },
            booking: { status: "approved" },
            vehicle: { vendor: { username: currentUser.username } },
          },
          include: includeQuery,
          orderBy: { startTime: "desc" },
        })
        break

      default:
        trips = await prisma.trip.findMany({
          where: {
            startTime: { gte: startDate, lte: endDate },
            booking: { status: "approved" },
          },
          include: includeQuery,
          orderBy: { startTime: "desc" },
        })
        break
    }

    if (vendorId && vendorId !== "all") {
      trips = trips.filter((trip) => trip.vehicle.vendorId === vendorId)
    }

    // Map data to the flat structure you requested
    const reportData = trips
      .filter(trip => trip.booking) // Ensure trip has a booking
      .map((trip) => {
        let duration = "N/A"
        if (trip.startTime && trip.endTime) {
          duration = formatDistanceStrict(trip.endTime, trip.startTime)
        }

        return {
          readableId: trip.booking?.readableId ? `#${trip.booking.readableId}` : "N/A",
          vendorName: trip.vehicle.vendor?.username || "N/A",
          hydrantName: trip.booking?.hydrant?.name || "N/A",
          destinationName: trip.booking?.destination?.name || "N/A",
          customerName: trip.booking?.customer?.name || "N/A",
          customerPhone: trip.booking?.customer?.contactNumber || "N/A",
          vehicleNumber: trip.vehicle.vehicleNumber,
          startTime: trip.startTime ? format(trip.startTime, "dd-MM-yyyy hh:mm a") : "N/A",
          endTime: trip.endTime ? format(trip.endTime, "dd-MM-yyyy hh:mm a") : "N/A",
          duration: duration,
          totalDistance: trip.distance || 0,
        }
      })

    return {
      status: 200,
      data: reportData,
    }
  } catch (error) {
    console.error("Error fetching bookings report:", error)
    return { status: 500, message: "Internal server error" }
  }
}