import { NextResponse } from 'next/server'
import { updateDestination, deleteDestination } from '@/actions/destinations'

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const result = await updateDestination(id, body)
    return NextResponse.json(result, { status: result.status })

  } catch (error) {
    console.error('Mobile PUT Destination error:', error)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const result = await deleteDestination(id)
    return NextResponse.json(result, { status: result.status })
  } catch (error) {
    console.error('Mobile DELETE Destination error:', error)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}
