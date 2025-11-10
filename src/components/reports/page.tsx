import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs" // <-- Import Tabs
import React from 'react'
import TripsReportPage from "./TripsReport"
import BookingReport from "./BookingReport"

const ReportsPage = () => {
  return (
    // Add the Tabs component
    <Tabs defaultValue="trips" className="w-full">
      <TabsList className="grid w-full grid-cols-2 max-w-md mb-4">
        <TabsTrigger value="trips">Revenue Report</TabsTrigger>
        <TabsTrigger value="bookings">Booking Report</TabsTrigger>
      </TabsList>
      
      {/* Your existing Trips Report is now in a tab */}
      <TabsContent value="trips">
        <TripsReportPage />
      </TabsContent>
      
      {/* The new Booking Report is in the second tab */}
      <TabsContent value="bookings">
        <BookingReport />
      </TabsContent>
    </Tabs>
  )
}

export default ReportsPage