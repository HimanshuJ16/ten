import { useState, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import { getBookings, addBooking, updateBooking, deleteBooking, approveBooking, disapproveBooking } from '@/actions/bookings'
import { Booking, Vendor } from '@prisma/client'
import { BookingSchemaType } from '@/schemas/booking.schema'
import { getVendorDetails } from '@/actions/bookings'; // Import getVendorDetails


export const useBookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(false)
  const [vendorDetails, setVendorDetails] = useState<Vendor | null>(null); // Add state for vendor details
  const { toast } = useToast()

  const fetchBookings = async () => {
    setLoading(true)
    try {
      const fetchedBookings = await getBookings()
      if (fetchedBookings) {
        setBookings(fetchedBookings)
      } else {
        toast({ title: 'Error', description: 'Failed to fetch bookings', variant: 'destructive' })
      }
    } catch (error) {
      console.error('Error fetching bookings:', error)
      toast({ title: 'Error', description: 'An unexpected error occurred', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBookings()
  }, [])

  const onAddBooking = async (data: BookingSchemaType) => {
    setLoading(true)
    const result = await addBooking(data)
    if (result.status === 200) {
      toast({ title: 'Success', description: result.message })
      await fetchBookings()
    } else {
      toast({ title: 'Error', description: result.message, variant: 'destructive' })
    }
    setLoading(false)
  }

  const onUpdateBooking = async (id: string, data: BookingSchemaType) => {
    setLoading(true)
    if (!id || id.trim() === '') {
      toast({ title: 'Error', description: 'Invalid booking ID', variant: 'destructive' })
      setLoading(false)
      return
    }
    const result = await updateBooking(id, data)
    if (result.status === 200) {
      toast({ title: 'Success', description: result.message })
      await fetchBookings()
      // Refresh vendor details
      if (data.vendorId) {
        const vendorResult = await getVendorDetails(data.vendorId)
        if (vendorResult.status === 200) {
          if (vendorResult.data) {
            setVendorDetails(vendorResult.data);
          } else {
            console.error('Vendor details data is null');
          }
        } else {
          toast({ title: 'Warning', description: 'Failed to refresh vendor details', variant: 'destructive' })
        }
      }
    } else {
      toast({ title: 'Error', description: result.message, variant: 'destructive' })
    }
    setLoading(false)
  }

  const onDeleteBooking = async (id: string) => {
    setLoading(true)
    const result = await deleteBooking(id)
    if (result.status === 200) {
      toast({ title: 'Success', description: result.message })
      await fetchBookings()
    } else {
      toast({ title: 'Error', description: result.message, variant: 'destructive' })
    }
    setLoading(false)
  }

  const onApproveBooking = async (id: string) => {
    setLoading(true)
    const result = await approveBooking(id)
    if (result.status === 200) {
      toast({ title: 'Success', description: result.message })
      await fetchBookings()
    } else {
      toast({ title: 'Error', description: result.message, variant: 'destructive' })
    }
    setLoading(false)
  }

  const onDisapproveBooking = async (id: string) => {
    setLoading(true)
    const result = await disapproveBooking(id)
    if (result.status === 200) {
      toast({ title: 'Success', description: result.message })
      await fetchBookings()
    } else {
      toast({ title: 'Error', description: result.message, variant: 'destructive' })
    }
    setLoading(false)
  }

  return {
    bookings,
    loading,
    onAddBooking,
    onUpdateBooking,
    onDeleteBooking,
    onApproveBooking,
    onDisapproveBooking
  }
}