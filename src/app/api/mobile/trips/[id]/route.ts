import { NextResponse } from 'next/server'
import { client } from '@/lib/prisma'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const trip = await client.trip.findUnique({
      where: { id },
      include: {
        booking: {
          include: {
            customer: true,
            hydrant: true,
            destination: true,
            vehicle: true,
          }
        }
      }
    })

    if (!trip) {
      return NextResponse.json({ message: 'Trip not found' }, { status: 404 })
    }

    return NextResponse.json(trip)
  } catch (error) {
    console.error('Mobile GET Trip Details error:', error)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}
