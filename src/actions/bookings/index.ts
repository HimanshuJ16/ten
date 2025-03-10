'use server'

import { client } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { cookies } from  'next/headers'
import { verify } from 'jsonwebtoken'
import { BookingSchemaType } from '@/schemas/booking.schema'
import { Prisma } from '@prisma/client'

interface JwtPayload {
  userId: string;
  username: string;
  role: string;
}

async function getCurrentUser() {
  const cookieStore = cookies()
  const token = (await cookieStore).get('token')?.value

  if (!token) return null

  try {
    const decoded = verify(token, process.env.JWT_SECRET!) as JwtPayload
    
    const dbUser = await client.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, district: true, username: true, role: true }
    })

    return dbUser
  } catch (error) {
    console.error('Error verifying token:', error)
    return null
  }
}

export const getBookings = async () => {
  const currentUser = await getCurrentUser()
  if (!currentUser) return null

  try {
    let bookings

    const includeRelations = {
      vendor: true,
      jen: true,
      customer: true,
      vehicle: true,
      hydrant: true,
      destination: true,
      trip: true,
    }

    switch (currentUser.role) {
      case 'contractor':
        bookings = await client.booking.findMany({
          where: {
            jen: {
              contractor: {
                username: currentUser.username
              }
            }
          },
          include: includeRelations
        })
        break

      case 'se':
        bookings = await client.booking.findMany({
          where: {
            jen: {
              aen: {
                xen: {
                  se: { username: currentUser.username },
                },
              },
            },
          },
          include: includeRelations,
        });
        break;

      case 'xen':
        bookings = await client.booking.findMany({
          where: {
            jen: {
              aen: {
                xen: { username: currentUser.username },
              },
            },
          },
          include: includeRelations,
        });
        break;    

      case 'aen':
        bookings = await client.booking.findMany({
          where: {
            jen: {
              aen: {
                username: currentUser.username
              }
            }
          },
          include: includeRelations
        })
        break

      case 'jen':
        bookings = await client.booking.findMany({
          where: {
            jen: { username: currentUser.username }
          },
          include: includeRelations
        })
        break

      case 'vendor':
        bookings = await client.booking.findMany({
          where: {
            vendor: { username: currentUser.username }
          },
          include: includeRelations
        })
        break

      default:
        throw new Error('Unauthorized to view bookings')
    }

    return bookings
  } catch (error) {
    console.error('Error fetching bookings:', error)
    return null
  }
}

export const addBooking = async (data: BookingSchemaType) => {
  const currentUser = await getCurrentUser()
  if (!currentUser) return { status: 401, message: 'Unauthorized' }

  if (!['contractor', 'aen', 'jen'].includes(currentUser.role)) {
    return { status: 403, message: 'Unauthorized to add bookings' }
  }

  try {
    const vendor = await client.vendor.findUnique({
      where: { id: data.vendorId },
      include: { jen: true }
    })

    if (!vendor) {
      throw new Error('Vendor not found')
    }

    const newBooking = await client.booking.create({
      data: {
        type: data.type,
        bookingType: data.bookingType,
        scheduledDateTime: data.scheduledDateTime,
        vendor: { connect: { id: data.vendorId } },
        jen: { connect: { id: vendor.jen.id } },
        customer: { connect: { id: data.customerId } },
        vehicle: { connect: { id: data.vehicleId } },
        hydrant: { connect: { id: data.hydrantId } },
        destination: { connect: { id: data.destinationId } },
      },
    })

    revalidatePath('/bookings')
    return { status: 200, message: 'Booking added successfully', data: newBooking }
  } catch (error) {
    console.error('Error adding booking:', error)
    return { status: 500, message: 'Internal server error' }
  }
}

export const updateBooking = async (id: string, data: BookingSchemaType) => {
  const currentUser = await getCurrentUser()
  if (!currentUser) return { status: 401, message: 'Unauthorized' }

  if (!['contractor', 'aen', 'jen'].includes(currentUser.role)) {
    return { status: 403, message: 'Unauthorized to update bookings' }
  }

  if (!id || id.trim() === '') {
    return { status: 400, message: 'Invalid booking ID' }
  }

  try {
    const updateData: Prisma.BookingUpdateInput = {}

    if (data.vehicleId && data.vehicleId.trim() !== '') {
      updateData.vehicle = { connect: { id: data.vehicleId } }
    }

    if (data.destinationId && data.destinationId.trim() !== '') {
      updateData.destination = { connect: { id: data.destinationId } }
    }

    if (Object.keys(updateData).length === 0) {
      return { status: 400, message: 'No valid data to update' }
    }

    const updatedBooking = await client.booking.update({
      where: { id },
      data: updateData,
    })

    revalidatePath('/bookings')
    return { status: 200, message: 'Booking updated successfully', data: updatedBooking }
  } catch (error) {
    console.error('Error updating booking:', error)
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2023') {
        return { status: 400, message: 'Invalid booking ID format' }
      }
    }
    return { status: 500, message: 'Internal server error' }
  }
}

export const deleteBooking = async (idOrIds: string | string[]) => {
  const currentUser = await getCurrentUser()
  if (!currentUser) return { status: 401, message: 'Unauthorized' }

  if (!['contractor', 'aen', 'jen'].includes(currentUser.role)) {
    return { status: 403, message: 'Unauthorized to delete bookings' }
  }

  try {
    if (Array.isArray(idOrIds)) {
      await client.booking.deleteMany({
        where: {
          id: { in: idOrIds }
        }
      })
    } else {
      await client.booking.delete({
        where: { id: idOrIds }
      })
    }

    revalidatePath('/bookings')
    return { status: 200, message: 'Booking(s) deleted successfully' }
  } catch (error) {
    console.error('Error deleting booking:', error)
    return { status: 500, message: 'Internal server error' }
  }
}

export const approveBooking = async (id: string) => {
  const currentUser = await getCurrentUser()
  if (!currentUser) return { status: 401, message: 'Unauthorized' }

  if (!['aen', 'jen'].includes(currentUser.role)) {
    return { status: 403, message: 'Unauthorized to approve bookings' }
  }

  try {
    const updatedBooking = await client.booking.update({
      where: { id },
      data: {
        approved: true,
        status: 'approved'
      },
    })

    revalidatePath('/bookings')
    return { status: 200, message: 'Booking approved successfully', data: updatedBooking }
  } catch (error) {
    console.error('Error approving booking:', error)
    return { status: 500, message: 'Internal server error' }
  }
}

export const disapproveBooking = async (id: string) => {
  const currentUser = await getCurrentUser()
  if (!currentUser) return { status: 401, message: 'Unauthorized' }

  if (!['aen', 'jen'].includes(currentUser.role)) {
    return { status: 403, message: 'Unauthorized to disapprove bookings' }
  }

  try {
    const updatedBooking = await client.booking.update({
      where: { id },
      data: {
        approved: false,
        status: 'disapproved'
      },
    })

    revalidatePath('/bookings')
    return { status: 200, message: 'Booking disapproved successfully', data: updatedBooking }
  } catch (error) {
    console.error('Error disapproving booking:', error)
    return { status: 500, message: 'Internal server error' }
  }
}

export const getTripDetails = async (bookingId: string) => {
  const currentUser = await getCurrentUser()
  if (!currentUser) return { status: 401, message: "Unauthorized" }

  try {
    const tripDetails = await client.trip.findFirst({
      where: { bookingId },
      include: {
        booking: {
          include: {
            customer: true,
            hydrant: true,
            destination: true,
            vehicle: true,
          },
        },
      },
    })

    if (!tripDetails) {
      return { status: 404, message: "Trip not found" }
    }

    return { status: 200, data: tripDetails }
  } catch (error) {
    console.error("Error fetching trip details:", error)
    return { status: 500, message: "Internal server error" }
  }
}
