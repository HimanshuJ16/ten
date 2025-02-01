import { useState, useEffect, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import { getActiveBookings, getTrackingData, startTracking, stopTracking } from "@/actions/tracking"
import type { Booking } from "@prisma/client"

interface TrackingData {
  bookingId: string
  vehicleNumber: string | undefined
  driverContactNumber: string | undefined
  currentLocation: {
    latitude: number
    longitude: number
    timestamp: Date
  } | null
  tripStatus: string
}

export const useTracking = () => {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [selectedBooking, setSelectedBooking] = useState<string | null>(null)
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchActiveBookings = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getActiveBookings()
      if (result.status === 200 && result.data) {
        setBookings(result.data)
      } else {
        setError(result.message || "Failed to fetch bookings")
        toast({ title: "Error", description: result.message || "Failed to fetch bookings", variant: "destructive" })
      }
    } catch (error) {
      console.error("Error fetching active bookings:", error)
      setError("An unexpected error occurred")
      toast({ title: "Error", description: "An unexpected error occurred", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchActiveBookings()
  }, [fetchActiveBookings])

  const fetchTrackingData = useCallback(async () => {
    if (!selectedBooking) return

    setLoading(true)
    try {
      const result = await getTrackingData(selectedBooking)
      if (result.status === 200 && result.data) {
        setTrackingData(result.data)
      } else {
        setError(result.message || "Failed to fetch tracking data")
        toast({
          title: "Error",
          description: result.message || "Failed to fetch tracking data",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching tracking data:", error)
      setError("An unexpected error occurred")
      toast({ title: "Error", description: "An unexpected error occurred", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [selectedBooking, toast])

  useEffect(() => {
    if (selectedBooking) {
      fetchTrackingData()
    }
  }, [selectedBooking, fetchTrackingData])

  const startTrackingTrip = async () => {
    if (!selectedBooking) return

    setLoading(true)
    try {
      const result = await startTracking(selectedBooking)
      if (result.status === 200) {
        toast({ title: "Success", description: result.message })
        await fetchTrackingData()
      } else {
        setError(result.message || "Failed to start tracking")
        toast({ title: "Error", description: result.message || "Failed to start tracking", variant: "destructive" })
      }
    } catch (error) {
      console.error("Error starting tracking:", error)
      setError("An unexpected error occurred")
      toast({ title: "Error", description: "An unexpected error occurred", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const stopTrackingTrip = async () => {
    if (!selectedBooking) return

    setLoading(true)
    try {
      const result = await stopTracking(selectedBooking)
      if (result.status === 200) {
        toast({ title: "Success", description: result.message })
        setTrackingData(null)
        setSelectedBooking(null)
        await fetchActiveBookings()
      } else {
        setError(result.message || "Failed to stop tracking")
        toast({ title: "Error", description: result.message || "Failed to stop tracking", variant: "destructive" })
      }
    } catch (error) {
      console.error("Error stopping tracking:", error)
      setError("An unexpected error occurred")
      toast({ title: "Error", description: "An unexpected error occurred", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return {
    bookings,
    selectedBooking,
    setSelectedBooking: (value: string | null) => setSelectedBooking(value),
    trackingData,
    loading,
    error,
    startTrackingTrip,
    stopTrackingTrip,
  }
}

