import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { getTripDetails } from "@/actions/bookings"
import type { Trip, Booking, Customer, Hydrant, Destination, Vehicle } from "@prisma/client"

interface TripWithDetails extends Trip {
  booking?:
    | (Booking & {
        customer?: Customer
        hydrant?: Hydrant
        destination?: Destination
        vehicle?: Vehicle
      })
    | null
}

export const useTripDetails = (bookingId: string | null) => {
  const [tripDetails, setTripDetails] = useState<TripWithDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const fetchTripDetails = async () => {
      if (!bookingId) return

      setLoading(true)
      try {
        const result = await getTripDetails(bookingId)
        if (result.status === 200) {
          const tripDetails = result.data as TripWithDetails | null;
          setTripDetails(tripDetails);
        } else {
          toast({ title: "Error", description: result.message, variant: "destructive" })
        }
      } catch (error) {
        console.error("Error fetching trip details:", error)
        toast({ title: "Error", description: "An unexpected error occurred", variant: "destructive" })
      } finally {
        setLoading(false)
      }
    }

    fetchTripDetails()
  }, [bookingId, toast])

  return { tripDetails, loading }
}

