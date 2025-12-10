import { NextResponse } from 'next/server'
import { getDestinations, addDestination } from '@/actions/destinations'

export async function GET() {
  try {
    const destinations = await getDestinations()

    if (destinations === null) {
      return NextResponse.json({ message: 'Failed to fetch destinations or unauthorized' }, { status: 401 })
    }

    return NextResponse.json(destinations)
  } catch (error) {
    console.error('Mobile GET Destinations error:', error)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const result = await addDestination(body)

    return NextResponse.json(result, { status: result.status })
  } catch (error) {
    console.error('Mobile POST Destination error:', error)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}
