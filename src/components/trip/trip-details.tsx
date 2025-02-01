"use client"

import { useTripDetails } from "@/hooks/trip/use-trip-details"
import { Loader } from "../loader"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"

interface TripDetailProps {
  bookingId: string | null
}

export function TripDetail({ bookingId }: TripDetailProps) {
  const { tripDetails, loading } = useTripDetails(bookingId)

  if (loading) {
    return <Loader loading={loading}>Loading trip details...</Loader>
  }

  if (!tripDetails) {
    return <div>No trip details found.</div>
  }

  return (
    <ScrollArea className="h-[calc(100vh-200px)] pr-4">
      <div className="space-y-8 mt-4">
        <Table>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium w-[12rem]">Trip ID</TableCell>
              <TableCell>{tripDetails.id}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Customer Name</TableCell>
              <TableCell>{tripDetails.booking?.customer?.name || "N/A"}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Customer Phone</TableCell>
              <TableCell>{tripDetails.booking?.customer?.contactNumber || "N/A"}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Hydrant Name</TableCell>
              <TableCell>{tripDetails.booking?.hydrant?.name || "N/A"}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Destination Name</TableCell>
              <TableCell>{tripDetails.booking?.destination?.name || "N/A"}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Trip Accepted By Driver</TableCell>
              <TableCell>
                {tripDetails.createdAt ? new Date(tripDetails.createdAt).toLocaleString() : "Not started"}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Trip Start</TableCell>
              <TableCell>
                {tripDetails.startTime ? new Date(tripDetails.startTime).toLocaleString() : "Not started"}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Trip End</TableCell>
              <TableCell>{tripDetails.endTime ? new Date(tripDetails.endTime).toLocaleString() : "Not ended"}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Distance</TableCell>
              <TableCell>{(tripDetails.distance)?.toFixed(2)} KM</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Vehicle Number</TableCell>
              <TableCell>{tripDetails.booking?.vehicle?.vehicleNumber || "N/A"}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Trip Status</TableCell>
              <TableCell>{tripDetails.status}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Trip Start Photo</TableCell>
              <TableCell>
                <img src={tripDetails.photo || "/placeholder.svg"} alt="Trip Photo" className="max-w-full h-auto" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Video After Supply</TableCell>
              <TableCell>
                <video controls className="max-w-full h-auto">
                  <source src={tripDetails.video || ""} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
                {/* <a href={tripDetails.video || ""} className="text-blue-500 underline">Video here</a> */}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </ScrollArea>
  )
}



