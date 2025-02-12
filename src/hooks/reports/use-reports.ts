"use client"

import { useState, useEffect, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import { getTripsReport, getVendors } from "@/actions/reports"

export interface TripReportData {
  username: string
  vehicleNumber: string
  totalTrips: number
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