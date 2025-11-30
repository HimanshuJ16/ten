"use client"

import { useState, useEffect, useMemo } from "react"
import { BookingsDataTable, type Booking } from "./data-table"
import { useBookings } from "@/hooks/bookings/use-bookings"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format, startOfDay, endOfDay } from "date-fns"
import { Eye, Edit, Check, X, CalendarIcon, Ban, ShieldCheck } from "lucide-react"
import { getVendors, getVendorDetails } from "@/actions/vendors"
import type { BookingSchemaType } from "@/schemas/booking.schema"
import { getUserRole } from "@/actions/settings"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import type { ColumnDef } from "@tanstack/react-table"
import type { DateRange } from "react-day-picker"
import { toast } from "@/hooks/use-toast"
import { TripDetail } from "@/components/trip/trip-details"
import type React from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Calendar } from "../ui/calendar"
import { Loader } from "../loader"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function BookingsPage() {
  const {
    bookings,
    onAddBooking,
    onUpdateBooking,
    onApproveBooking,
    onDisapproveBooking,
    onCancelBooking,
    refreshBookings,
    loading,
  } = useBookings()

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  // State for new cancel dialog
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false)
  const [cancellationReason, setCancellationReason] = useState("")

  // OTP Dialog State
  const [isOtpDialogOpen, setIsOtpDialogOpen] = useState(false)
  const [otp, setOtp] = useState("")
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null)
  const [otpLoading, setOtpLoading] = useState(false)

  const [currentBooking, setCurrentBooking] = useState<Booking | null>(null)
  const [formData, setFormData] = useState<BookingSchemaType>({
    type: "normal",
    bookingType: "regular",
    scheduledDateTime: new Date(),
    vendorId: "",
    customerId: "",
    vehicleId: "",
    hydrantId: "",
    destinationId: "",
  })
  const [vendorDetails, setVendorDetails] = useState<any>(null)
  const [userRole, setUserRole] = useState("")
  const [date, setDate] = useState<Date>()
  const [vendors, setVendors] = useState<{ id: string; name: string; username: string }[]>([])
  const [selectedBookings, setSelectedBookings] = useState<string[]>([])
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfDay(new Date()),
    to: endOfDay(new Date()),
  })
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const handleDateRangeChange = (newDateRange: DateRange | undefined) => {
    setDateRange(newDateRange)
  }

  useEffect(() => {
    const fetchUserRoleAndVendors = async () => {
      const role = await getUserRole()
      setUserRole(role || "")

      const vendorsResult = await getVendors()
      if (vendorsResult.status === 200) {
        setVendors(vendorsResult.data ?? [])
      }
    }

    fetchUserRoleAndVendors()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSelectChange = (name: string) => (value: string) => {
    setFormData({ ...formData, [name]: value })
    if (name === "vendorId") {
      fetchRelatedData(value)
    }
  }

  const fetchRelatedData = async (vendorId: string) => {
    const result = await getVendorDetails(vendorId)
    if (result.status === 200) {
      setVendorDetails(result.data)
    } else {
      console.error("Error fetching vendor details:", result.message)
      toast({ title: "Error", description: "Failed to fetch vendor details", variant: "destructive" })
    }
  }

  const handleAddBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    await onAddBooking(formData)
    setIsAddDialogOpen(false)
    resetFormData()
  }

  const handleUpdateBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    if (currentBooking) {
      await onUpdateBooking(currentBooking.id!, formData)
    }
    setIsEditDialogOpen(false)
    setCurrentBooking(null)
    resetFormData()
  }

  // New handler for submitting the cancellation
  const handleCancelBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    if (currentBooking && cancellationReason) {
      if (cancellationReason.length < 10) {
        toast({
          title: "Error",
          description: "Cancellation reason must be at least 10 characters long",
          variant: "destructive",
        })
        return
      }
      await onCancelBooking(currentBooking.id!, cancellationReason)
      setIsCancelDialogOpen(false)
      setCurrentBooking(null)
      setCancellationReason("")
    } else {
      toast({ title: "Error", description: "Cancellation reason is required", variant: "destructive" })
    }
  }

  // OTP Handlers
  const handleSendOtp = async () => {
    if (!currentBooking?.customer?.contactNumber) {
      toast({ title: "Error", description: "Customer phone number not available", variant: "destructive" })
      return
    }
    
    // Get Trip ID
    const tripId = currentBooking?.trip && currentBooking.trip.length > 0 ? currentBooking.trip[0].id : null
    if (!tripId) {
      toast({ title: "Error", description: "No active trip found for this booking", variant: "destructive" })
      return
    }

    setOtpLoading(true)
    try {
      const response = await fetch('/api/trip/send-otp', {
        method: 'POST',
        // Pass tripId along with phoneNumber
        body: JSON.stringify({ 
            phoneNumber: currentBooking.customer.contactNumber,
            tripId: tripId,
            isWeb: true 
        }),
        headers: { 'Content-Type': 'application/json' }
      })
      
      const data = await response.json()
      
      if (data.success) {
        setGeneratedOtp(data.otp) // Store the returned OTP
        toast({ title: "Success", description: "OTP generated successfully" })
        refreshBookings() // Update list so OTP persists if dialog is closed/reopened
      } else {
        toast({ title: "Error", description: data.error || "Failed to send OTP", variant: "destructive" })
      }
    } catch (e) {
      console.error(e)
      toast({ title: "Error", description: "Failed to generate OTP", variant: "destructive" })
    }
    setOtpLoading(false)
  }

  const handleVerifyOtp = async () => {
    if (!otp) return
    
    setOtpLoading(true)
    const tripId = currentBooking?.trip && currentBooking.trip.length > 0 ? currentBooking.trip[0].id : null
    
    if (!tripId) {
       toast({ title: "Error", description: "No active trip found", variant: "destructive" })
       setOtpLoading(false)
       return
    }

    try {
      const response = await fetch('/api/trip/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ otp, tripId }),
        headers: { 'Content-Type': 'application/json' }
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast({ title: "Success", description: "Trip verified and completed" })
        setIsOtpDialogOpen(false)
        setGeneratedOtp(null)
        setOtp("")
        refreshBookings()
      } else {
        toast({ title: "Error", description: data.error || "Invalid OTP", variant: "destructive" })
      }
    } catch (e) {
      console.error(e)
      toast({ title: "Error", description: "Verification failed", variant: "destructive" })
    }
    setOtpLoading(false)
  }

  const resetFormData = () => {
    setFormData({
      type: "normal",
      bookingType: "regular",
      scheduledDateTime: new Date(),
      vendorId: "",
      customerId: "",
      vehicleId: "",
      hydrantId: "",
      destinationId: "",
    })
    setDate(undefined)
  }

  const canCreateBooking = ["contractor", "aen", "jen"].includes(userRole)
  const canApprove = ["aen", "jen"].includes(userRole)

  const columns: ColumnDef<Booking>[] = [
    {
      accessorKey: "type",
      header: "Type",
    },
    {
      accessorKey: "bookingType",
      header: "Booking Type",
    },
    {
      accessorKey: "customer.name",
      header: "Customer Name",
    },
    {
      accessorKey: "vehicle.vehicleNumber",
      header: "Vehicle Number",
    },
    {
      accessorKey: "hydrant.name",
      header: "Hydrant Name",
    },
    {
      accessorKey: "destination.name",
      header: "Destination Name",
    },
    {
      accessorKey: "scheduledDateTime",
      header: "Scheduled Date Time",
      cell: ({ row }) => format(new Date(row.getValue("scheduledDateTime")), "PPP, p"),
    },
    {
      accessorKey: "vendor.username",
      header: "Vendor",
    },
    {
      accessorKey: "jen.username",
      header: "JEN",
    },
    {
      accessorKey: "status",
      header: "Status",
      // Updated cell to show cancellation reason in a popover
      cell: ({ row }) => {
        const booking = row.original as Booking & { cancellationReason?: string | null }
        if (booking.status === "cancelled" && booking.cancellationReason) {
          return (
            <Popover>
              <PopoverTrigger className="underline cursor-pointer">Cancelled</PopoverTrigger>
              <PopoverContent>
                <p className="text-sm font-semibold">Cancellation Reason:</p>
                <p>{booking.cancellationReason}</p>
              </PopoverContent>
            </Popover>
          )
        }
        return row.getValue("status")
      },
    },
    {
      accessorKey: "trip",
      header: "Trip Status",
      cell: ({ row }) => {
        const trip = row.original.trip // Get the trip array
        if (trip && trip.length > 0) {
          return trip[0].status // Return the status of the first trip
        }
        return "trip not started" // Return a default value if no trip exists
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const trip = row.original.trip
        const tripStatus = trip && trip.length > 0 ? trip[0].status : null
        const bookingStatus = row.original.status

        // Show edit button if no trip OR trip is rejected OR booking is pending
        const canEdit = (!trip[0] || tripStatus === "rejected") && bookingStatus === "pending"
        
        // Show OTP button if status is 'delivered' AND booking is NOT cancelled
        const canVerifyDelivery = tripStatus === "delivered" && bookingStatus !== "cancelled"

        return (
          <div className="flex flex-col gap-2 w-40">
            <Button variant="outline" size="sm" className="w-full" onClick={() => openTripDetails(row.original.id)}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </Button>
            
            {/* Verify Delivery Button */}
            {canVerifyDelivery && (
               <Button
                variant="default"
                size="sm"
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={() => {
                    setCurrentBooking(row.original)
                    // Check if OTP already exists on the trip
                    const existingOtp = row.original.trip?.[0]?.otp || null
                    setGeneratedOtp(existingOtp)
                    setOtp("")
                    setIsOtpDialogOpen(true)
                }}
              >
                <ShieldCheck className="mr-2 h-4 w-4" />
                Verify Delivery
              </Button>
            )}

            {canEdit && (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  setCurrentBooking(row.original)
                  setFormData({
                    type: row.original.type as "normal" | "emergency",
                    bookingType: row.original.bookingType as "regular" | "scheduled",
                    scheduledDateTime: new Date(row.original.scheduledDateTime),
                    vendorId: row.original.vendor.id,
                    customerId: row.original.customer.id,
                    vehicleId: row.original.vehicle.id,
                    hydrantId: row.original.hydrant.id,
                    destinationId: row.original.destination.id,
                    approved: row.original.approved,
                  })
                  fetchRelatedData(row.original.vendor.id)
                  setIsEditDialogOpen(true)
                }}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            )}
            {canApprove && bookingStatus === "pending" && tripStatus === "completed" && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-green-600 hover:text-green-700 hover:bg-green-50"
                  onClick={() => onApproveBooking(row.original.id)}
                >
                  <Check className="mr-2 h-4 w-4" />
                  Approve
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => onDisapproveBooking(row.original.id)}
                >
                  <X className="mr-2 h-4 w-4" />
                  Disapprove
                </Button>
              </>
            )}

            {/* Cancel Button Logic: Show if user can approve AND status is pending or approved */}
            {canApprove && (bookingStatus === "pending" || bookingStatus === "approved") && tripStatus !== "completed" && (
              <Button
                variant="outline"
                size="sm"
                className="w-full text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                onClick={() => {
                  setCurrentBooking(row.original)
                  setIsCancelDialogOpen(true)
                }}
              >
                <Ban className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            )}
          </div>
        )
      },
    },
  ]

  const sortedBookings = useMemo(() => {
    return [...bookings].sort((a, b) => {
      const dateA = a.scheduledDateTime ? new Date(a.scheduledDateTime) : null
      const dateB = b.scheduledDateTime ? new Date(b.scheduledDateTime) : null

      if (dateA && dateB) {
        return dateB.getTime() - dateA.getTime()
      } else if (dateA) {
        return -1 // a comes first if b doesn't have a date
      } else if (dateB) {
        return 1 // b comes first if a doesn't have a date
      }
      return 0 // both are null, maintain original order
    })
  }, [bookings])

  const [isTripDetailOpen, setIsTripDetailOpen] = useState(false)
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null)

  const openTripDetails = (bookingId: string) => {
    setSelectedBookingId(bookingId)
    setIsTripDetailOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex space-x-2">
          <DateRangePicker dateRange={dateRange} onDateRangeChange={handleDateRangeChange} />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="disapproved">Disapproved</SelectItem>
              {/* Added "cancelled" to filter options */}
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex space-x-2">
          {canApprove && selectedBookings.length > 0 && (
            <div className="space-x-2">
              <Button onClick={() => selectedBookings.forEach((id) => onApproveBooking(id))}>
                Approve Selected ({selectedBookings.length})
              </Button>
            </div>
          )}
          {canCreateBooking && <Button onClick={() => setIsAddDialogOpen(true)}>Add Booking</Button>}
        </div>
      </div>

      <BookingsDataTable
        columns={columns}
        data={sortedBookings as unknown as Booking[]}
        selectedBookings={selectedBookings}
        setSelectedBookings={setSelectedBookings}
        dateRange={dateRange || { from: new Date(), to: new Date() }}
        statusFilter={statusFilter}
      />

      {/* --- ADD BOOKING DIALOG --- */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Booking</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddBooking} className="space-y-4">
            <Select name="type" value={formData.type} onValueChange={handleSelectChange("type")}>
              <SelectTrigger>
                <SelectValue placeholder="Select booking type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="emergency">Emergency</SelectItem>
              </SelectContent>
            </Select>
            <Select name="bookingType" value={formData.bookingType} onValueChange={handleSelectChange("bookingType")}>
              <SelectTrigger>
                <SelectValue placeholder="Select booking type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="regular">Regular</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
              </SelectContent>
            </Select>
            {formData.bookingType === "scheduled" && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn("w-[280px] justify-start text-left font-normal", !date && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(newDate) => {
                      setDate(newDate)
                      setFormData({ ...formData, scheduledDateTime: newDate || new Date() })
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            )}
            <Select name="vendorId" value={formData.vendorId} onValueChange={handleSelectChange("vendorId")}>
              <SelectTrigger>
                <SelectValue placeholder="Select vendor" />
              </SelectTrigger>
              <SelectContent>
                {vendors.map((vendor) => (
                  <SelectItem key={vendor.id} value={vendor.id}>
                    {vendor.name} - {vendor.username}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select name="customerId" value={formData.customerId} onValueChange={handleSelectChange("customerId")}>
              <SelectTrigger>
                <SelectValue placeholder="Select customer" />
              </SelectTrigger>
              <SelectContent>
                {vendorDetails?.customers.map((customer: { id: string; name: string }) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select name="vehicleId" value={formData.vehicleId} onValueChange={handleSelectChange("vehicleId")}>
              <SelectTrigger>
                <SelectValue placeholder="Select vehicle" />
              </SelectTrigger>
              <SelectContent>
                {vendorDetails?.vehicles.map((vehicle: { id: string; vehicleNumber: string }) => (
                  <SelectItem key={vehicle.id} value={vehicle.id}>
                    {vehicle.vehicleNumber}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select name="hydrantId" value={formData.hydrantId} onValueChange={handleSelectChange("hydrantId")}>
              <SelectTrigger>
                <SelectValue placeholder="Select hydrant" />
              </SelectTrigger>
              <SelectContent>
                {vendorDetails?.hydrants.map((hydrant: { id: string; name: string }) => (
                  <SelectItem key={hydrant.id} value={hydrant.id}>
                    {hydrant.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              name="destinationId"
              value={formData.destinationId}
              onValueChange={handleSelectChange("destinationId")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select destination" />
              </SelectTrigger>
              <SelectContent>
                {vendorDetails?.destinations.map((destination: { id: string; name: string }) => (
                  <SelectItem key={destination.id} value={destination.id}>
                    {destination.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="submit">
              <Loader loading={loading}>Submit</Loader>
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* --- EDIT BOOKING DIALOG --- */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Booking</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateBooking} className="space-y-4">
            <Select name="vehicleId" value={formData.vehicleId} onValueChange={handleSelectChange("vehicleId")}>
              <SelectTrigger>
                <SelectValue placeholder="Select vehicle" />
              </SelectTrigger>
              <SelectContent>
                {vendorDetails?.vehicles?.map((vehicle: { id: string; vehicleNumber: string }) => (
                  <SelectItem key={vehicle.id} value={vehicle.id}>
                    {vehicle.vehicleNumber}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              name="destinationId"
              value={formData.destinationId}
              onValueChange={handleSelectChange("destinationId")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select destination" />
              </SelectTrigger>
              <SelectContent>
                {vendorDetails?.destinations?.map((destination: { id: string; name: string }) => (
                  <SelectItem key={destination.id} value={destination.id}>
                    {destination.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="submit">Update Booking</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* --- NEW CANCEL BOOKING DIALOG --- */}
      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Booking</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this booking? Please provide a reason below. This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCancelBooking} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="cancellationReason">Cancellation Reason</label>
              <Textarea
                id="cancellationReason"
                placeholder="Type your reason here (min 10 characters)..."
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsCancelDialogOpen(false)}>
                Close
              </Button>
              <Button type="submit" variant="destructive" disabled={cancellationReason.length < 10 || loading}>
                <Loader loading={loading}>Submit Cancellation</Loader>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* --- OTP VERIFICATION DIALOG --- */}
      <Dialog open={isOtpDialogOpen} onOpenChange={(open) => {
          setIsOtpDialogOpen(open)
          if(!open) { setGeneratedOtp(null); setOtp(""); } // Clear on close
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Verify Trip Delivery</DialogTitle>
            <DialogDescription>
              Generate an OTP for the customer. If they cannot receive it, you can share the code below with the driver.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Customer Details */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">Customer</Label>
              <Input id="phone" value={currentBooking?.customer?.name || ""} disabled className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
               <Label htmlFor="contact" className="text-right">Phone</Label>
               <Input id="contact" value={currentBooking?.customer?.contactNumber || "N/A"} disabled className="col-span-3" />
            </div>
            
            {/* Action Area */}
            {!generatedOtp ? (
                <div className="flex justify-center pt-2">
                     <Button 
                       onClick={handleSendOtp} 
                       disabled={otpLoading || !currentBooking?.customer?.contactNumber}
                     >
                       <Loader loading={otpLoading}>Generate OTP</Loader>
                     </Button>
                </div>
            ) : (
                <>
                    {/* Display OTP for Web Admin */}
                    <div className="flex flex-col items-center justify-center bg-slate-100 p-4 rounded-lg border-2 border-slate-200 border-dashed my-2">
                        <span className="text-sm text-slate-500 mb-1">Verification Code</span>
                        <span className="text-3xl font-bold tracking-[0.5em] text-slate-900">{generatedOtp}</span>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4 mt-2">
                        <Label htmlFor="otp" className="text-right">Verify</Label>
                        <Input
                            id="otp"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            placeholder="Enter code to verify manually"
                            className="col-span-3"
                        />
                    </div>
                    <div className="flex justify-center gap-2 pt-2">
                         <Button variant="ghost" onClick={handleSendOtp} disabled={otpLoading}>
                            Resend SMS
                         </Button>
                         <Button onClick={handleVerifyOtp} disabled={otpLoading || otp.length < 4}>
                            <Loader loading={otpLoading}>Verify Delivery</Loader>
                         </Button>
                    </div>
                </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* --- TRIP DETAILS DIALOG --- */}
      <Dialog open={isTripDetailOpen} onOpenChange={setIsTripDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[calc(100vh-40px)] p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>Trip Details</DialogTitle>
          </DialogHeader>
          <div className="px-6 pb-6">
            <TripDetail bookingId={selectedBookingId} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}