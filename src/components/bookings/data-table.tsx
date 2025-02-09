'use client';

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { DateRange } from "react-day-picker"

export interface Booking {
  approved: boolean | undefined
  id: string
  type: string
  bookingType: string
  scheduledDateTime: Date
  status: string
  customer: { id: string, name: string }
  vehicle: { id: string, vehicleNumber: string }
  hydrant: { id: string, name: string}
  destination: { id: string, name: string }
  vendor: { id: string, username: string }
  jen: { username: string }
  trip: { id: string; status: string } | null
}

interface BookingsDataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  onApprove?: (ids: string[]) => Promise<void>
  onDisapprove?: (ids: string[]) => Promise<void>
  onDelete?: (ids: string[]) => void
  selectedBookings: string[]
  setSelectedBookings: React.Dispatch<React.SetStateAction<string[]>>
  dateRange: DateRange | undefined
  statusFilter: string
}

export function BookingsDataTable<TData extends Booking, TValue>({
  columns,
  data,
  selectedBookings,
  setSelectedBookings,
  dateRange,
  statusFilter,
}: BookingsDataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = 
    React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

  const filteredData = React.useMemo(() => {
    return data.filter(booking => {
      const bookingDate = new Date(booking.scheduledDateTime)
      const isInDateRange = !dateRange || (
        (!dateRange.from || bookingDate >= dateRange.from) &&
        (!dateRange.to || bookingDate <= dateRange.to)
      )
      const matchesStatus = statusFilter === 'all' || booking.status === statusFilter
      return isInDateRange && matchesStatus
    })
  }, [data, dateRange, statusFilter])

  const table = useReactTable({
    data: filteredData,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  const handleSelectBooking = (bookingId: string) => {
    setSelectedBookings(prev => 
      prev.includes(bookingId) 
        ? prev.filter(id => id !== bookingId)
        : [...prev, bookingId]
    )
  }

  const handleSelectAll = () => {
    if (selectedBookings.length === filteredData.length) {
      setSelectedBookings([])
    } else {
      setSelectedBookings(filteredData.map(booking => booking.id))
    }
  }

  const getRowClassName = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-blue-50 hover:bg-blue-100'
      case 'approved':
        return 'bg-green-50 hover:bg-green-100'
      case 'disapproved':
        return 'bg-red-50 hover:bg-red-100'
      default:
        return 'hover:bg-gray-100'
    }
  }

  return (
    <div className="w-full">
      <div className="rounded-md border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-gray-100">
                <TableHead className="w-[40px] text-center">
                  <Checkbox
                    checked={selectedBookings.length === filteredData.length}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="font-semibold text-gray-700">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={`${getRowClassName(row.original.status)} transition-colors`}
                >
                  <TableCell className="text-center">
                    <Checkbox
                      checked={selectedBookings.includes(row.original.id)}
                      onCheckedChange={() => handleSelectBooking(row.original.id)}
                    />
                  </TableCell>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length + 2} className="h-24 text-center text-gray-500">
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="flex-1 text-sm text-gray-700">
          {selectedBookings.length} of {filteredData.length} row(s) selected.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
