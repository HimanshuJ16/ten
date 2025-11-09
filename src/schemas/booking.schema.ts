import { z } from 'zod'

export const BookingSchema = z.object({
  id: z.string().uuid().optional(),
  type: z.enum(['normal', 'emergency']),
  bookingType: z.enum(['regular', 'scheduled']),
  scheduledDateTime: z.date().optional(),
  approved: z.boolean().optional(),
  status: z.enum(['pending', 'approved', 'disapproved', 'cancelled']).optional(),
  vendorId: z.string().uuid('Invalid vendor ID'),
  jenId: z.string().uuid('Invalid JEN ID').optional(),
  customerId: z.string().uuid('Invalid customer ID'),
  vehicleId: z.string().uuid('Invalid vehicle ID'),
  hydrantId: z.string().uuid('Invalid hydrant ID'),
  destinationId: z.string().uuid('Invalid destination ID'),
  cancellationReason: z.string().optional().nullable(),
})

export type BookingSchemaType = z.infer<typeof BookingSchema>

// Add new schema for the cancellation form
export const CancelBookingSchema = z.object({
  cancellationReason: z.string().min(10, {
    message: 'Cancellation reason must be at least 10 characters long.',
  }),
})

export type CancelBookingSchemaType = z.infer<typeof CancelBookingSchema>