import { NextResponse } from 'next/server'
import { getTripDetails } from '@/actions/bookings'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const result = await getTripDetails(id)

    if (result.status !== 200) {
      return NextResponse.json(result, { status: result.status })
    }
    return NextResponse.json(result.data)
  } catch (error) {
    console.error('Mobile GET Booking Trip Details error:', error)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}
