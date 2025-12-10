import { NextResponse } from 'next/server'
import { getVehicles, addVehicle } from '@/actions/vehicles'

export async function GET() {
  try {
    const vehicles = await getVehicles()

    if (vehicles === null) {
      return NextResponse.json({ message: 'Failed to fetch vehicles or unauthorized' }, { status: 401 })
    }

    return NextResponse.json(vehicles)
  } catch (error) {
    console.error('Mobile GET Vehicles error:', error)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const result = await addVehicle(body)

    return NextResponse.json(result, { status: result.status })
  } catch (error) {
    console.error('Mobile POST Vehicle error:', error)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}
