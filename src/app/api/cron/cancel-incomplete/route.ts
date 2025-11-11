// File: web/src/app/api/cron/cancel-incomplete/route.ts

import { client } from '@/lib/prisma' //
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  console.log('Running nightly cron job to cancel incomplete bookings...')

  try {
    const bookingsToCancel = await client.booking.findMany({
      where: {
        status: 'pending',
        trip: {
          some: {
            status: {
              not: 'completed',
            },
          },
        },
      },
      select: {
        id: true,
      },
    })

    const bookingIds = bookingsToCancel.map((b) => b.id)

    if (bookingIds.length === 0) {
      console.log('No incomplete bookings found. Exiting.')
      return NextResponse.json({ status: 200, message: 'No incomplete bookings found.' })
    }

    console.log(`Found ${bookingIds.length} bookings to cancel:`, bookingIds)

    // 3. Update these bookings to 'cancelled'
    const updateResult = await client.booking.updateMany({
      where: {
        id: {
          in: bookingIds,
        },
      },
      data: {
        status: 'cancelled',
        cancellationReason: 'Auto-cancelled: Trip not completed by midnight.', //
        approved: false,
      },
    })

    console.log(`Successfully cancelled ${updateResult.count} bookings.`)
    return NextResponse.json({ 
      status: 200, 
      message: `Successfully cancelled ${updateResult.count} bookings.` 
    })

  } catch (error) {
    console.error('Error running cancelIncompleteBookings cron job:', error)
    return NextResponse.json({ status: 500, message: 'Internal server error' }, { status: 500 })
  }
}