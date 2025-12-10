import { NextResponse } from 'next/server'
import { getBookings, addBooking } from '@/actions/bookings'

export async function GET() {
  try {
    const bookings = await getBookings()

    if (bookings === null) {
      // getBookings returns null on error or unauthorized inside, 
      // but usually it handles its own auth check and returns null if failed/unauth.
      // We might want to be more specific if possible, but for now 401/403/500 generic.
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
    const result = await addBooking(body)

    return NextResponse.json(result, { status: result.status })
  } catch (error) {
    console.error('Mobile POST Booking error:', error)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}
