// File: web/src/app/api/reports/stats/route.ts

import { client } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const vehicleId = searchParams.get('vehicleId')
    const timeFilter = searchParams.get('timeFilter') || 'week' // Default to 'week'

    if (!vehicleId) {
      return NextResponse.json(
        { success: false, message: 'Vehicle ID is required' },
        { status: 400 }
      )
    }

    // 1. Determine the start date based on the time filter
    const now = new Date()
    let startDate = new Date()

    switch (timeFilter) {
      case 'month':
        startDate.setMonth(now.getMonth() - 1)
        break
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1)
        break
      case 'week':
      default:
        startDate.setDate(now.getDate() - 7)
        break
    }

    // 2. Fetch all trips for the vehicle within the time range
    const trips = await client.trip.findMany({
      where: {
        vehicleId: vehicleId,
        createdAt: {
          gte: startDate, // Filter by time
        },
      },
      include: {
        booking: {
          include: {
            hydrant: true, // To get the 'from' name
            destination: true, // To get the 'to' name
          },
        },
      },
      orderBy: {
        createdAt: 'desc', // Get most recent trips first
      },
    })

    // 3. Calculate TripStats
    let completedTrips = 0
    let ongoingTrips = 0
    let totalDistance = 0
    let totalHours = 0

    for (const trip of trips) {
      if (trip.status === 'completed') {
        completedTrips++
      } else if (
        trip.status === 'ongoing' ||
        trip.status === 'pickup' ||
        trip.status === 'delivered'
      ) {
        ongoingTrips++
      }

      totalDistance += trip.distance || 0

      // Calculate trip duration in hours if possible
      if (trip.startTime && trip.endTime) {
        const start = new Date(trip.startTime).getTime()
        const end = new Date(trip.endTime).getTime()
        const diffMs = end - start
        if (diffMs > 0) {
          totalHours += diffMs / (1000 * 60 * 60) // Convert ms to hours
        }
      }
    }

    const stats = {
      totalTrips: trips.length,
      completedTrips: completedTrips,
      ongoingTrips: ongoingTrips,
      totalDistance: Math.round(totalDistance * 10) / 10, // Format to 1 decimal
      totalHours: Math.round(totalHours * 10) / 10, // Format to 1 decimal
      avgRating: 5.0, // Hardcoded as per frontend fallback (schema does not have rating)
    }

    // 4. Format RecentTrip[] data
    const recentTrips = trips.slice(0, 10).map((trip) => ({
      tripId: trip.id,
      date: trip.createdAt.toISOString(),
      from: trip.booking?.hydrant?.name || 'Unknown Hydrant',
      to: trip.booking?.destination?.name || 'Unknown Destination',
      status: trip.status,
      distance: (trip.distance || 0).toFixed(1), // Format to 1 decimal string
    }))

    // 5. Return the combined response
    return NextResponse.json({ success: true, stats, recentTrips })
  } catch (error) {
    console.error('Error fetching report stats:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}