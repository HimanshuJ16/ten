import { useState, useEffect, useCallback, useRef } from "react"
import { useToast } from "@/hooks/use-toast"
import { getActiveBookings, getTrackingData, startTracking, stopTracking } from "@/actions/tracking"
import type { Booking } from "@prisma/client"
import { io, type Socket } from "socket.io-client"

interface TrackingData {
  bookingId: string
  vehicleNumber: string | undefined
  driverContactNumber: string | undefined
  currentLocation: {
    latitude: number
    longitude: number
    timestamp?: Date // Timestamp from DB
  } | null
  tripStatus: string
}

// Define the shape of the live location data from the socket
interface LiveLocation {
  latitude: number
  longitude: number
  altitude: number | null
  speed: number | null
  heading: number | null
}

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || "http://localhost:8080";

export const useTracking = () => {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [selectedBooking, setSelectedBooking] = useState<string | null>(null)
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  
  // Use a ref to store the socket instance
  const socketRef = useRef<Socket | null>(null);

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

  // This function now only fetches the *initial* static data for the trip
  const fetchInitialTrackingData = useCallback(async (bookingId: string) => {
    setLoading(true)
    try {
      const result = await getTrackingData(bookingId)
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
  }, [toast])

  // Effect to manage socket connection
  useEffect(() => {
    if (selectedBooking) {
      // 1. Fetch the initial trip data (driver name, vehicle, etc.)
      fetchInitialTrackingData(selectedBooking);

      // 2. Connect to the WebSocket server
      socketRef.current = io(SOCKET_URL);

      // 3. Subscribe to the trip's room
      socketRef.current.emit("start_tracking", { bookingId: selectedBooking });

      // 4. Listen for new location updates
      socketRef.current.on("new_location", (location: LiveLocation) => {
        console.log("Received new location:", location);
        setTrackingData((prevData) => {
          if (!prevData) return null;
          return {
            ...prevData,
            currentLocation: {
              latitude: location.latitude,
              longitude: location.longitude,
            }
          };
        });
      });

      // 5. Handle connection errors
      socketRef.current.on("connect_error", (err) => {
        console.error("Socket connection error:", err.message);
        toast({ title: "Tracking Error", description: "Could not connect to live tracking service.", variant: "destructive" });
      });

      // Cleanup function
      return () => {
        if (socketRef.current) {
          socketRef.current.emit("stop_tracking", { bookingId: selectedBooking });
          socketRef.current.off("new_location");
          socketRef.current.disconnect();
          socketRef.current = null;
        }
      };
    }
  // We only want this effect to re-run when selectedBooking changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBooking]); 

  // This function is now just a state setter
  const startTrackingTrip = () => {
    if (!selectedBooking) return;
    // The useEffect hook will handle the rest
    setTrackingData(null); // Clear previous data
    setError(null);
  };

  const stopTrackingTrip = async () => {
    if (!selectedBooking) return;
    
    // The socket cleanup is handled by the useEffect,
    // but we also call the `stopTracking` *action* if it does anything else (e.g., API calls)
    setLoading(true);
    try {
      // Note: This 'stopTracking' action might be redundant now,
      // but we'll keep it if it does other cleanup.
      const result = await stopTracking(selectedBooking);
      if (result.status === 200) {
        toast({ title: "Success", description: result.message });
      } else {
        toast({ title: "Error", description: result.message || "Failed to stop tracking", variant: "destructive" });
      }
    } catch (error) {
       console.error("Error stopping tracking:", error)
       toast({ title: "Error", description: "An unexpected error occurred", variant: "destructive" })
    } finally {
       // Clear state and selection, which triggers the useEffect cleanup
       setTrackingData(null);
       setSelectedBooking(null);
       setLoading(false);
       fetchActiveBookings(); // Refresh the list of active bookings
    }
  };

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