"use client"

import { useState, useEffect } from "react"
import { useTracking } from "@/hooks/tracking/use-tracking"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Loader2, MapPin, PhoneCall } from "lucide-react"
import dynamic from "next/dynamic"
import { getVehicleNumber } from "@/actions/tracking"

const TrackingMap = dynamic(() => import("./TrackingMap"), {
  ssr: false,
  loading: () => <div className="h-[400px] w-full flex items-center justify-center bg-gray-100">Loading map...</div>,
})

export default function TrackingComponent() {
  const {
    bookings,
    selectedBooking,
    setSelectedBooking,
    trackingData,
    loading,
    error,
    startTrackingTrip,
    stopTrackingTrip,
  } = useTracking()

  const [isMounted, setIsMounted] = useState(false)
  const [vehicleNumbers, setVehicleNumbers] = useState<{ [key: string]: any }>({});

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Fetch vehicle numbers when bookings change
  useEffect(() => {
    const fetchVehicleNumbers = async () => {
    const vehicleData: { [key: string]: any } = {};
      for (const booking of bookings) {
        if (booking.vehicleId) {
          const response = await getVehicleNumber(booking.vehicleId)
          if (response.status === 200) {
            vehicleData[booking.id] = response.data
          } else {
            vehicleData[booking.id] = "Unknown"
          }
        } else {
          vehicleData[booking.id] = "Unknown"
        }
      }
      setVehicleNumbers(vehicleData)
    }

    if (bookings.length) {
      fetchVehicleNumbers()
    }
  }, [bookings])

  if (!isMounted) {
    return null
  }

  if (loading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6">
          <p className="text-red-500">Error: {error}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full mt-[-1.5rem]">
      <CardHeader>
        <CardTitle className="text-red-500 text-sm">* Note: This feature is only available for active trips</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!trackingData ? (
          <>
            <Select value={selectedBooking || ""} onValueChange={setSelectedBooking}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a vehicle" />
              </SelectTrigger>
              <SelectContent>
                {bookings.map((booking) => (
                  <SelectItem key={booking.id} value={booking.id}>
                    {vehicleNumbers[booking.id]  || "Loading..."}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={startTrackingTrip} disabled={!selectedBooking} className="w-full">
              Start Tracking
            </Button>
          </>
        ) : (
          <>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-[-.5rem]">
              <PhoneCall className="w-4 h-4" />
              <span>Driver Contact: {trackingData.driverContactNumber}</span>
            </div>

            {/* --- THIS IS THE NEW BLOCK TO DISPLAY LIVE LOCATION --- */}
            {trackingData.currentLocation && (
              <Card className="bg-muted">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center">
                    <MapPin className="w-4 h-4 mr-2" />
                    Live Coordinates
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Latitude:</span>
                    <span className="font-mono">{trackingData.currentLocation.latitude.toFixed(6)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Longitude:</span>
                    <span className="font-mono">{trackingData.currentLocation.longitude.toFixed(6)}</span>
                  </div>
                </CardContent>
              </Card>
            )}
            {/* ---------------------------------------------------- */}

            <div className="h-[400px] w-full rounded-md overflow-hidden">
              {trackingData.currentLocation && (
                <TrackingMap
                  center={[trackingData.currentLocation.longitude, trackingData.currentLocation.latitude]}
                  zoom={15}
                />
              )}
            </div>
           
            {/* I removed the old, small location text from here */}

            <Button onClick={stopTrackingTrip} variant="destructive" className="w-full">
              Stop Tracking
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}