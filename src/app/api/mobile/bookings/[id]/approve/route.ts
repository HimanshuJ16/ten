import { NextResponse } from 'next/server'
import { approveBooking } from '@/actions/bookings'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const result = await approveBooking(id) // server action handles auth check

    if (!result) {
      return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
    }

    return NextResponse.json(result, { status: result.status })
  } catch (error) {
    console.error('Mobile Approve Booking error:', error)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}
