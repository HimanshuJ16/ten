import { client } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  let parsedData: any = {}

  const contentType = request.headers.get("content-type") || ""

  if (contentType.includes("application/json")) {
    const rawBody = await request.json()
    if (process.env.NODE_ENV !== "production") {
      console.log("🔍 Raw JSON body:", rawBody)
    }
    parsedData = rawBody.data || rawBody
  } else {
    const formData = await request.formData()
    for (const [key, value] of formData.entries()) {
      parsedData[key] = value
    }
  }

  const {
    secret,
  } = parsedData

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ status: 401, message: 'Unauthorized' }, { status: 401 })
  }

  console.log('Running nightly cron job to cancel incomplete bookings...')

  try {
    const bookingsToCancel = await client.booking.findMany({
      where: {
        status: 'pending',
        trip: {
          none: {
            status: 'completed',
          },
        },
      },
      select: {
        id: true,
      },
    })

    const bookingIds = bookingsToCancel.map((b) => b.id)

    if (bookingIds.length === 0) {
      console.log('No incomplete pending bookings found. Exiting.')
      return NextResponse.json({ status: 200, message: 'No incomplete pending bookings found.' })
    }

    console.log(`Found ${bookingIds.length} pending bookings to cancel:`, bookingIds)

    // 3. Update these bookings to 'cancelled'
    const updateResult = await client.booking.updateMany({
      where: {
        id: {
          in: bookingIds,
        },
      },
      data: {
        status: 'cancelled',
        cancellationReason: 'Auto-cancelled: Booking not completed by midnight.',
        approved: false,
      },
    })

    console.log(`Successfully cancelled ${updateResult.count} bookings.`)
    return NextResponse.json({
      status: 200,
      message: `Successfully cancelled ${updateResult.count} bookings.`,
    })
  } catch (error) {
    console.error('Error running cancelIncompleteBookings cron job:', error)
    return NextResponse.json({ status: 500, message: 'Internal server error' }, { status: 500 })
  }
}