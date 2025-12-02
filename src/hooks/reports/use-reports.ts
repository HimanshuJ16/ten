"use client"

import { useState, useEffect, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import { getBookingsReport, getTripsReport, getVendors } from "@/actions/reports"

export interface TripReportData {
  username: string
  vehicleNumber: string
  totalTrips: number
  totalDistance: number
}

export type BookingReportData = {
  readableId: string;
  vendorName: string
  hydrantName: string
  destinationName: string
  customerName: string
  customerPhone: string
  vehicleNumber: string
  startTime: string
  endTime: string
  duration: string
  totalDistance: number
}

interface Vendor {
  id: string
  username: string // Changed from name to username
}

export const useTripsReport = (startDate?: Date, endDate?: Date, vendorId?: string) => {
  const [data, setData] = useState<TripReportData[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [vendors, setVendors] = useState<Vendor[]>([])
  const { toast } = useToast()

  const fetchVendors = useCallback(async () => {
    const result = await getVendors()
    if (result.status === 200 && result.data) {
      setVendors(result.data)
    } else {
      toast({ title: "Error", description: result.message })
    }
  }, [toast])

  const fetchTripsReport = useCallback(async () => {
    if (!startDate || !endDate) return

    setLoading(true)
    const result = await getTripsReport(startDate, endDate, vendorId)
    if (result.status === 200) {
      setData(result.data ?? null)
    } else {
      toast({ title: "Error", description: result.message })
    }
    setLoading(false)
  }, [startDate, endDate, vendorId, toast])

  useEffect(() => {
    fetchVendors()
  }, [fetchVendors])

  useEffect(() => {
    fetchTripsReport()
  }, [fetchTripsReport])

  return { data, loading, refetch: fetchTripsReport, vendors }
}

// ADD THIS NEW HOOK
export const useBookingsReport = (
  startDate: Date | undefined,
  endDate: Date | undefined,
  vendorId: string,
) => {
  const [data, setData] = useState<BookingReportData[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [vendors, setVendors] = useState<{ id: string; username: string }[]>([])

  const fetchVendors = async () => {
    try {
      const res = await getVendors()
      if (res.status === 200 && res.data) {
        setVendors(res.data)
      }
    } catch (error) {
      console.error("Error fetching vendors:", error)
    }
  }

  const fetchReport = async () => {
    if (!startDate || !endDate) return
    setLoading(true)
    try {
      const res = await getBookingsReport(startDate, endDate, vendorId)
      if (res.status === 200 && res.data) {
        setData(res.data)
      } else {
        setData(null)
      }
    } catch (error) {
      console.error("Error fetching bookings report:", error)
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVendors()
    fetchReport()
  }, [startDate, endDate, vendorId])

  return { data, loading, refetch: fetchReport, vendors }
}