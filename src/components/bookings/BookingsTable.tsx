'use client'

import { useState, useEffect, useMemo } from 'react'
import { BookingsDataTable, Booking } from './data-table'
import { useBookings } from '@/hooks/bookings/use-bookings'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { format, startOfDay, endOfDay, parseISO } from 'date-fns'
import { Calendar as CalendarIcon, Clock } from 'lucide-react'
import { getVendors, getVendorDetails } from '@/actions/bookings'
import { BookingSchemaType } from '@/schemas/booking.schema'
import { getUserRole } from '@/actions/settings'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { ColumnDef } from "@tanstack/react-table"
import { DateRange } from "react-day-picker"
import { toast } from '@/hooks/use-toast'
import { Loader } from '../loader'

export default function BookingsPage() {
  const { bookings, onAddBooking, onUpdateBooking, onApproveBooking, onDisapproveBooking, onDeleteBooking, loading } = useBookings()
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [currentBooking, setCurrentBooking] = useState<BookingSchemaType | null>(null)
  const [formData, setFormData] = useState<BookingSchemaType>({
    type: 'normal',
    bookingType: 'regular',
    scheduledDateTime: new Date(),
    vendorId: '',
    customerId: '',
    vehicleId: '',
    hydrantId: '',
    destinationId: '',
  })
  const [vendorDetails, setVendorDetails] = useState<any>(null)
  const [userRole, setUserRole] = useState('')
  const [date, setDate] = useState<Date>()
  const [vendors, setVendors] = useState<{ name: string; id: string; createdAt: Date; updatedAt: Date; jenId: string; username: string; district: string; circleId: string; }[]>([])
  const [selectedBookings, setSelectedBookings] = useState<string[]>([])
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfDay(new Date()),
    to: endOfDay(new Date())
  })
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const handleDateRangeChange = (newDateRange: DateRange | undefined) => {
    setDateRange(newDateRange)
  }

  useEffect(() => {
    const fetchUserRoleAndVendors = async () => {
      const role = await getUserRole()
      setUserRole(role || '')
  
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
    if (name === 'vendorId') {
      fetchRelatedData(value)
    }
  }

  const fetchRelatedData = async (vendorId: string) => {
    const result = await getVendorDetails(vendorId)
    if (result.status === 200) {
      setVendorDetails(result.data)
    } else {
      console.error('Error fetching vendor details:', result.message)
      toast({ title: 'Error', description: 'Failed to fetch vendor details', variant: 'destructive' })
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

  const resetFormData = () => {
    setFormData({
      type: 'normal',
      bookingType: 'regular',
      scheduledDateTime: new Date(),
      vendorId: '',
      customerId: '',
      vehicleId: '',
      hydrantId: '',
      destinationId: '',
    })
    setDate(undefined)
  }

  const canCreateBooking = ['contractor', 'aen', 'jen'].includes(userRole)
  const canApprove = ['aen', 'jen'].includes(userRole)
  const canDelete = userRole === 'contractor'

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
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <span>{row.original.vehicle.vehicleNumber}</span>
          {['contractor', 'aen', 'jen'].includes(userRole) && (
            <Button variant="outline" size="sm" onClick={() => {
              setCurrentBooking({
                id: row.original.id,
                type: row.original.type === 'normal' || row.original.type === 'emergency' ? row.original.type : 'normal', // default to 'normal' if type is not 'emergency'
                bookingType: row.original.bookingType === 'regular' || row.original.bookingType === 'scheduled' ? row.original.bookingType : 'regular',
                scheduledDateTime: new Date(row.original.scheduledDateTime),
                vendorId: row.original.vendor.id,
                customerId: row.original.customer.id,
                vehicleId: row.original.vehicle.id,
                hydrantId: row.original.hydrant.id,
                destinationId: row.original.destination.id,
                approved: row.original.approved,
                status: row.original.status === 'approved' || row.original.status === 'pending' || row.original.status === 'disapproved' ? row.original.status : undefined,
              })
              setFormData({
                ...formData,
                vehicleId: row.original.vehicle.id,
                vendorId: row.original.vendor.id,
              })
              fetchRelatedData(row.original.vendor.id)
              setIsEditDialogOpen(true)
            }}>
              Edit
            </Button>
          )}
        </div>
      ),
    },
    {
      accessorKey: "hydrant.name",
      header: "Hydrant Name",
    },
    {
      accessorKey: "destination.name",
      header: "Destination Name",
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <span>{row.original.destination.name}</span>
          {['contractor', 'aen', 'jen'].includes(userRole) && (
            <Button variant="outline" size="sm" onClick={() => {
              setCurrentBooking({
                id: row.original.id,
                type: row.original.type === 'normal' || row.original.type === 'emergency' ? row.original.type : 'normal', // default to 'normal' if type is not 'emergency'
                bookingType: row.original.bookingType === 'regular' || row.original.bookingType === 'scheduled' ? row.original.bookingType : 'regular',
                scheduledDateTime: new Date(row.original.scheduledDateTime),
                vendorId: row.original.vendor.id,
                customerId: row.original.customer.id,
                vehicleId: row.original.vehicle.id,
                hydrantId: row.original.hydrant.id,
                destinationId: row.original.destination.id,
                approved: row.original.approved,
                status: row.original.status === 'approved' || row.original.status === 'pending' || row.original.status === 'disapproved' ? row.original.status : undefined,
              })
              setFormData({
                ...formData,
                destinationId: row.original.destination.id,
                vendorId: row.original.vendor.id,
              })
              fetchRelatedData(row.original.vendor.id)
              setIsEditDialogOpen(true)
            }}>
              Edit
            </Button>
          )}
        </div>
      ),
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

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex space-x-2">
          <DateRangePicker
            dateRange={dateRange}
            onDateRangeChange={handleDateRangeChange}
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="disapproved">Disapproved</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className='flex space-x-2'>        
          {canApprove && selectedBookings.length > 0 && (
            <div className="space-x-2">
              <Button onClick={() => selectedBookings.forEach(id => onApproveBooking(id))}>
                Approve Selected ({selectedBookings.length})
              </Button>
              <Button variant="destructive" onClick={() => selectedBookings.forEach(id => onDisapproveBooking(id))}>
                Disapprove Selected ({selectedBookings.length})
              </Button>
            </div>
          )}
          {canCreateBooking && (
            <Button onClick={() => setIsAddDialogOpen(true)}>
              Add Booking
            </Button>
          )}
        </div>
      </div>

      <BookingsDataTable
        columns={columns}
        data={sortedBookings as unknown as Booking[]}
        onApprove={canApprove ? (ids) => Promise.all(ids.map(onApproveBooking)).then(() => {}) : undefined}
        onDisapprove={canApprove ? (ids) => Promise.all(ids.map(onDisapproveBooking)).then(() => {}) : undefined}
        onDelete={canDelete ? (ids) => Promise.all(ids.map(onDeleteBooking)).then(() => {}) : undefined}
        selectedBookings={selectedBookings}
        setSelectedBookings={setSelectedBookings}
        dateRange={dateRange || { from: new Date(), to: new Date() }}
        statusFilter={statusFilter}
      />

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Booking</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddBooking} className="space-y-4">
            <Select name="type" value={formData.type} onValueChange={handleSelectChange('type')}>
              <SelectTrigger>
                <SelectValue placeholder="Select booking type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="emergency">Emergency</SelectItem>
              </SelectContent>
            </Select>
            <Select name="bookingType" value={formData.bookingType} onValueChange={handleSelectChange('bookingType')}>
              <SelectTrigger>
                <SelectValue placeholder="Select booking type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="regular">Regular</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
              </SelectContent>
            </Select>
            {formData.bookingType === 'scheduled' && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-[280px] justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
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
            <Select name="vendorId" value={formData.vendorId} onValueChange={handleSelectChange('vendorId')}>
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
            <Select name="customerId" value={formData.customerId} onValueChange={handleSelectChange('customerId')}>
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
            <Select name="vehicleId" value={formData.vehicleId} onValueChange={handleSelectChange('vehicleId')}>
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
            <Select name="hydrantId" value={formData.hydrantId} onValueChange={handleSelectChange('hydrantId')}>
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
            <Select name="destinationId" value={formData.destinationId} onValueChange={handleSelectChange('destinationId')}>
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

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Booking</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateBooking} className="space-y-4">
            <Select name="vehicleId" value={formData.vehicleId} onValueChange={handleSelectChange('vehicleId')}>
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
            <Select name="destinationId" value={formData.destinationId} onValueChange={handleSelectChange('destinationId')}>
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
    </div>
  )
}