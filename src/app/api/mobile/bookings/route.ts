import { NextResponse } from 'next/server'
import { getBookings, addBooking } from '@/actions/bookings'

export async function GET() {
  try {
    const bookings = await getBookings()

    if (bookings === null) {
      return NextResponse.json({ message: 'Failed to fetch bookings or unauthorized' }, { status: 401 })
    }

    return NextResponse.json(bookings)
  } catch (error) {
    console.error('Mobile GET Bookings error:', error)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Parse Date string back to Date object if needed, but addBooking expects BookingSchemaType 
    // where scheduledDateTime is z.date(). JSON payload will have string.
    // However, Prisma/Zod interaction might need the date string to be converted before validation if Zod expects a Date object.

    // Convert scheduledDateTime string to Date object if it exists
    if (body.scheduledDateTime) {
      body.scheduledDateTime = new Date(body.scheduledDateTime);
    }

    const result = await addBooking(body)

    if (!result) {
      return NextResponse.json({ message: 'Unknown error occurred' }, { status: 500 })
    }

    return NextResponse.json(result, { status: result.status })
  } catch (error) {
    console.error('Mobile POST Booking error:', error)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}
