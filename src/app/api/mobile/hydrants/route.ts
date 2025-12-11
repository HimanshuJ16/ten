import { NextResponse } from 'next/server'
import { getHydrants, addHydrant } from '@/actions/hydrant'

export async function GET() {
  try {
    const hydrants = await getHydrants()

    if (hydrants === null) {
      return NextResponse.json({ message: 'Failed to fetch hydrants or unauthorized' }, { status: 401 })
    }

    return NextResponse.json(hydrants)
  } catch (error) {
    console.error('Mobile GET Hydrants error:', error)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const result = await addHydrant(body)

    if (!result) {
      return NextResponse.json({ message: 'Unknown error occurred' }, { status: 500 })
    }

    return NextResponse.json(result, { status: result.status })
  } catch (error) {
    console.error('Mobile POST Hydrant error:', error)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}
