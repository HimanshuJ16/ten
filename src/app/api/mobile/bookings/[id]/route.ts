import { NextResponse } from 'next/server'
import { updateBooking, deleteBooking, approveBooking, disapproveBooking, cancelBooking } from '@/actions/bookings'

// Helper to handle dynamic actions based on query param or body?
// Typically RESTful would be PUT /bookings/:id
// But we have multiple actions: update, approve, disapprove, cancel.
// We can use PATCH for updates and specific logic for status changes or query params.
// For simplicity and matching typical patterns:
// PATCH with body -> updateBooking
// POST with action query param? Or dedicated endpoints?
// Let's stick to standard methods first.
// updateBooking takes `BookingSchemaType` (partial?)
// approve/disapprove take ID.
// cancel takes ID + reason.

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()

    // Check if this is a special action
    if (body.action === 'approve') {
      const result = await approveBooking(id)
      return NextResponse.json(result, { status: result.status })
    }

    if (body.action === 'disapprove') {
      const result = await disapproveBooking(id)
      return NextResponse.json(result, { status: result.status })
    }

    if (body.action === 'cancel') {
      const result = await cancelBooking(id, body.reason)
      return NextResponse.json(result, { status: result.status })
    }

    // Default to update
    const result = await updateBooking(id, body)
    return NextResponse.json(result, { status: result.status })

  } catch (error) {
    console.error('Mobile PUT Booking error:', error)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const result = await deleteBooking(id)
    return NextResponse.json(result, { status: result.status })
  } catch (error) {
    console.error('Mobile DELETE Booking error:', error)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}
