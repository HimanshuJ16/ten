import { NextResponse } from 'next/server'
import { updateVehicle, deleteVehicle } from '@/actions/vehicles'

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const result = await updateVehicle(id, body)
    return NextResponse.json(result, { status: result.status })

  } catch (error) {
    console.error('Mobile PUT Vehicle error:', error)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const result = await deleteVehicle(id)
    return NextResponse.json(result, { status: result.status })
  } catch (error) {
    console.error('Mobile DELETE Vehicle error:', error)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}
