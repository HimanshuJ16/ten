import { NextResponse } from 'next/server'
import { disapproveBooking } from '@/actions/bookings'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id
    const result = await disapproveBooking(id)

    if (!result) {
      return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
    }

    return NextResponse.json(result, { status: result.status })
  } catch (error) {
    console.error('Mobile Disapprove Booking error:', error)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}
