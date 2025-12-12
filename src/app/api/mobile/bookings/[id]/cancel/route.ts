import { NextResponse } from 'next/server'
import { cancelBooking } from '@/actions/bookings'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id
    const body = await request.json()
    const { reason } = body

    const result = await cancelBooking(id, reason)

    if (!result) {
      return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
    }

    return NextResponse.json(result, { status: result.status })
  } catch (error) {
    console.error('Mobile Cancel Booking error:', error)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}
