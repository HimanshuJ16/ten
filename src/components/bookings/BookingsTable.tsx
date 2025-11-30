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
    refreshBookings, // Use the new refresh function
    loading,
  } = useBookings()

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false)
  // OTP Dialog State
  const [isOtpDialogOpen, setIsOtpDialogOpen] = useState(false)
  const [otp, setOtp] = useState("")
  const [verificationId, setVerificationId] = useState<string | null>(null)
  const [otpLoading, setOtpLoading] = useState(false)

  const [cancellationReason, setCancellationReason] = useState("")

  const [currentBooking, setCurrentBooking] = useState<Booking | null>(null) // Changed to generic Booking to hold full data
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

  // --- OTP HANDLERS ---
  const handleSendOtp = async () => {
    if (!currentBooking?.customer?.contactNumber) {
      toast({ title: "Error", description: "Customer phone number not available", variant: "destructive" })
      return
    }
    
    setOtpLoading(true)
    try {
      // Use existing API route
      const response = await fetch('/api/trip/send-otp', {
        method: 'POST',
        body: JSON.stringify({ phoneNumber: currentBooking.customer.contactNumber }),
        headers: { 'Content-Type': 'application/json' }
      })
      
      const data = await response.json()
      
      if (data.success) {
        setVerificationId(data.verificationId)
        toast({ title: "Success", description: "OTP sent successfully" })
      } else {
        toast({ title: "Error", description: data.error || "Failed to send OTP", variant: "destructive" })
      }
    } catch (e) {
      console.error(e)
      toast({ title: "Error", description: "Failed to send OTP", variant: "destructive" })
    }
    setOtpLoading(false)
  }

  const handleVerifyOtp = async () => {
    if (!verificationId || !otp) return
    
    setOtpLoading(true)
    const tripId = currentBooking?.trip && currentBooking.trip.length > 0 ? currentBooking.trip[0].id : null
    
    if (!tripId) {
       toast({ title: "Error", description: "No active trip found", variant: "destructive" })
       setOtpLoading(false)
       return
    }

    try {
      // Use existing API route
      const response = await fetch('/api/trip/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ verificationId, otp, tripId }),
        headers: { 'Content-Type': 'application/json' }
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast({ title: "Success", description: "Trip verified and completed" })
        setIsOtpDialogOpen(false)
        setVerificationId(null)
        setOtp("")
        refreshBookings() // Refresh the table
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
        const trip = row.original.trip
        if (trip && trip.length > 0) {
          return trip[0].status
        }
        return "trip not started"
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const trip = row.original.trip
        const tripStatus = trip && trip.length > 0 ? trip[0].status : null
        const bookingStatus = row.original.status

        const canEdit = (!trip[0] || tripStatus === "rejected") && bookingStatus === "pending"
        // Show OTP button if status is 'delivered'
        const canVerifyDelivery = tripStatus === "delivered"

        return (
          <div className="flex flex-col gap-2 w-40">
            <Button variant="outline" size="sm" className="w-full" onClick={() => openTripDetails(row.original.id)}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </Button>
            
            {/* NEW: Verify Delivery Button */}
            {canVerifyDelivery && (
               <Button
                variant="default"
                size="sm"
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={() => {
                    setCurrentBooking(row.original)
                    setVerificationId(null)
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
        return -1
      } else if (dateB) {
        return 1
      }
      return 0
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
      {/* Existing Header Controls */}
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

      {/* --- OTP VERIFICATION DIALOG --- */}
      <Dialog open={isOtpDialogOpen} onOpenChange={setIsOtpDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Verify Trip Delivery</DialogTitle>
            <DialogDescription>
              Verify the trip delivery by sending an OTP to the customer.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">
                Customer
              </Label>
              <Input
                id="phone"
                value={currentBooking?.customer?.name || ""}
                disabled
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
               <Label htmlFor="contact" className="text-right">
                Phone
               </Label>
               <Input
                 id="contact"
                 value={currentBooking?.customer?.contactNumber || "N/A"}
                 disabled
                 className="col-span-3"
               />
            </div>
            
            {!verificationId ? (
                <div className="flex justify-center pt-2">
                     <Button 
                       onClick={handleSendOtp} 
                       disabled={otpLoading || !currentBooking?.customer?.contactNumber}
                     >
                       <Loader loading={otpLoading}>Send OTP</Loader>
                     </Button>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="otp" className="text-right">
                            OTP
                        </Label>
                        <Input
                            id="otp"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            placeholder="Enter 4-digit OTP"
                            className="col-span-3"
                        />
                    </div>
                    <div className="flex justify-center gap-2 pt-2">
                         <Button variant="outline" onClick={handleSendOtp} disabled={otpLoading}>
                            Resend
                         </Button>
                         <Button onClick={handleVerifyOtp} disabled={otpLoading || otp.length < 4}>
                            <Loader loading={otpLoading}>Verify & Complete</Loader>
                         </Button>
                    </div>
                </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* --- ADD BOOKING DIALOG (Existing) --- */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        {/* Existing Content... */}
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Booking</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddBooking} className="space-y-4">
             {/* ... existing form fields ... */}
             {/* I am omitting the full content of this form to save space as it hasn't changed, 
                 but in a real implementation, you would keep the existing form JSX here */}
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

      {/* --- EDIT BOOKING DIALOG (Existing) --- */}
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

      {/* --- NEW CANCEL BOOKING DIALOG (Existing) --- */}
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

      {/* --- TRIP DETAILS DIALOG (Existing) --- */}
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