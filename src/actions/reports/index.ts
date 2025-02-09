"use server"

import { PrismaClient } from "@prisma/client"
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
  const currentUser = await getCurrentUser();
  if (!currentUser) return { status: 401, message: "Unauthorized" };

  try {
    let vendors: { id: string; username: string }[];

    switch (currentUser.role) {
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
        });
        break;

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
        });
        break;

      case "vendor":
        // Vendors don't need to see other vendors, so return an empty array
        vendors = [];
        break;

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
        });
        break;
    }

    return {
      status: 200,
      data: vendors,
    };
  } catch (error) {
    console.error("Error fetching vendors:", error);
    return { status: 500, message: "Internal server error" };
  }
};

export const getTripsReport = async (startDate?: Date, endDate?: Date, vendorId?: string) => {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { status: 401, message: "Unauthorized" };

  try {
    let trips;

    switch (currentUser.role) {
      case "aen":
        // Get trips for all vendors under all JENs managed by the AEN
        trips = await prisma.trip.findMany({
          where: {
            startTime: {
              gte: startDate,
              lte: endDate,
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
          },
          orderBy: { startTime: "desc" },
        });
        break;

      case "jen":
        // Get trips for all vendors under the JEN
        trips = await prisma.trip.findMany({
          where: {
            startTime: {
              gte: startDate,
              lte: endDate,
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
          },
          orderBy: { startTime: "desc" },
        });
        break;

      case "vendor":
        // Get trips for all vehicles under the vendor
        trips = await prisma.trip.findMany({
          where: {
            startTime: {
              gte: startDate,
              lte: endDate,
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
          },
          orderBy: { startTime: "desc" },
        });
        break;

      default:
        // For other roles, return all trips (or handle accordingly)
        trips = await prisma.trip.findMany({
          where: {
            startTime: {
              gte: startDate,
              lte: endDate,
            },
          },
          include: {
            vehicle: {
              include: {
                vendor: true,
              },
            },
          },
          orderBy: { startTime: "desc" },
        });
        break;
    }

    // Aggregate trips by vehicle and vendor
    const aggregatedData = trips.reduce((acc, trip) => {
      const key = `${trip.vehicle.vendor?.username || "N/A"}-${trip.vehicle.vehicleNumber}`;

      if (!acc[key]) {
        acc[key] = {
          username: trip.vehicle.vendor?.username || "N/A",
          vehicleNumber: trip.vehicle.vehicleNumber,
          totalTrips: 0,
          totalDistance: 0,
        };
      }

      acc[key].totalTrips += 1;
      acc[key].totalDistance += trip.distance || 0;

      return acc;
    }, {} as Record<string, any>);

    const reportData = Object.values(aggregatedData);

    return {
      status: 200,
      data: reportData,
    };
  } catch (error) {
    console.error("Error fetching trips report:", error);
    return { status: 500, message: "Internal server error" };
  }
};

