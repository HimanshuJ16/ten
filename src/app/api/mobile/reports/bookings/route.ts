import { NextResponse } from 'next/server'
import { getBookingsReport } from '@/actions/reports'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const startDateParam = searchParams.get('startDate')
    const endDateParam = searchParams.get('endDate')
    const vendorId = searchParams.get('vendorId') || undefined

    const startDate = startDateParam ? new Date(startDateParam) : undefined
    const endDate = endDateParam ? new Date(endDateParam) : undefined

    const result = await getBookingsReport(startDate, endDate, vendorId)
    return NextResponse.json(result, { status: result.status })
  } catch (error) {
    console.error('Mobile GET Report Bookings error:', error)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}
