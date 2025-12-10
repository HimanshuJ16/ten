import { NextResponse } from 'next/server'
import { updateHydrant, deleteHydrant } from '@/actions/hydrant'

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const result = await updateHydrant(id, body)
    return NextResponse.json(result, { status: result.status })

  } catch (error) {
    console.error('Mobile PUT Hydrant error:', error)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const result = await deleteHydrant(id)
    return NextResponse.json(result, { status: result.status })
  } catch (error) {
    console.error('Mobile DELETE Hydrant error:', error)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}
