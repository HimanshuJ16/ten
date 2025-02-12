"use client"

import { useEffect, useState } from "react"
import { useTripsReport, type TripReportData } from "@/hooks/reports/use-reports"
import { DataTable } from "./data-table"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format, startOfToday, endOfToday } from "date-fns"
import { CalendarIcon, Download, Copy } from "lucide-react"
import { cn } from "@/lib/utils"
import * as XLSX from "xlsx"
import jsPDF from "jspdf"
import autoTable, { type RowInput } from "jspdf-autotable"
import type { DateRange } from "react-day-picker"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getUserRole } from "@/actions/settings"

const columns = [
  {
    accessorKey: "serialNumber",
    header: "S.No",
    cell: ({ row }: { row: { index: number } }) => <span>{row.index + 1}</span>,
  },
  {
    accessorKey: "username",
    header: "Vendor",
  },
  {
    accessorKey: "vehicleNumber",
    header: "Tanker Number",
  },
  {
    accessorKey: "totalTrips",
    header: "Total Trips",
  },
  {
    accessorKey: "totalDistance",
    header: "Total Distance (km)",
  },
]

export default function TripsReportPage() {
  const [date, setDate] = useState<DateRange | undefined>({
    from: startOfToday(),
    to: endOfToday(),
  })
  const [selectedVendor, setSelectedVendor] = useState<string>("all")
  const { data, loading, refetch, vendors } = useTripsReport(date?.from, date?.to, selectedVendor)
  const [userRole, setUserRole] = useState("")

  useEffect(() => {
    const fetchUserRoleAndVendors = async () => {
      const role = await getUserRole()
      setUserRole(role || "")
    }

    fetchUserRoleAndVendors()
  }, [])

  const handleCopyToClipboard = () => {
    if (!data) return
    const headers = columns.map((col) => col.header).join("\t")
    const rows = data
      .map(
        (row, index) =>
          `${index + 1}\t${columns
            .slice(1)
            .map((col) => row[col.accessorKey as keyof TripReportData])
            .join("\t")}`,
      )
      .join("\n")
    navigator.clipboard.writeText(`S.No\t${headers}\n${rows}`)
  }

  const handleDownloadCSV = () => {
    if (!data) return
    const headers = columns.map((col) => col.header).join(",")
    const rows = data
      .map(
        (row, index) =>
          `${index + 1},${columns
            .slice(1)
            .map((col) => row[col.accessorKey as keyof TripReportData])
            .join(",")}`,
      )
      .join("\n")
    const blob = new Blob([`S.No,${headers}\n${rows}`], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "trips_report.csv"
    a.click()
  }

  const handleDownloadExcel = () => {
    if (!data) return
    const exportData = data.map((row, index) => {
      const newRow: Record<string, any> = { "S.No": index + 1 }
      columns.slice(1).forEach((col) => {
        newRow[col.header] = row[col.accessorKey as keyof TripReportData]
      })
      return newRow
    })
    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Trips Report")
    XLSX.writeFile(wb, "trips_report.xlsx")
  }

  const handleDownloadPDF = () => {
    if (!data) return
    const doc = new jsPDF()
    const tableData: RowInput[] = data.map((row, index) => [
      index + 1,
      ...columns.slice(1).map((col) => String(row[col.accessorKey as keyof TripReportData])),
    ])

    doc.setFontSize(16)
    doc.text("Revenue Report", 14, 15)
    doc.setFontSize(10)
    doc.text(
      `Date: ${date?.from ? format(date.from, "PPP") : "All"} to ${date?.to ? format(date.to, "PPP") : "All"}`,
      14,
      25,
    )

    autoTable(doc, {
      head: [columns.map((col) => col.header)],
      body: tableData,
      startY: 35,
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 1 },
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      alternateRowStyles: { fillColor: [224, 224, 224] },
    })

    if (data.length > 0) {
      const totals = data.reduce(
        (acc, row) => ({
          totalTrips: acc.totalTrips + row.totalTrips,
          totalDistance: acc.totalDistance + row.totalDistance,
        }),
        { totalTrips: 0, totalDistance: 0 },
      )

      autoTable(doc, {
        body: [["Total:", totals.totalTrips.toString(), totals.totalDistance.toFixed(2)]],
        styles: { fontSize: 8, cellPadding: 1, fontStyle: "bold" },
        theme: "grid",
      })
    }

    doc.save("trips_report.pdf")
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end gap-4">
          {userRole !== "vendor" && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Vendor</label>
              <Select
                value={selectedVendor}
                onValueChange={(value) => {
                  setSelectedVendor(value)
                  refetch()
                }}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select vendor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Vendors</SelectItem>
                  {vendors?.map((vendor) => (
                    <SelectItem key={vendor.id} value={vendor.id}>
                      {vendor.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Date Range</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-[300px] justify-start text-left font-normal", !date && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date?.from ? (
                    date.to ? (
                      <>
                        {format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(date.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={date?.from}
                  selected={date}
                  onSelect={setDate}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
          <Button onClick={() => refetch()} disabled={loading}>
            View
          </Button>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleCopyToClipboard} disabled={!data}>
            <Copy className="mr-2 h-4 w-4" />
            Copy
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadCSV} disabled={!data}>
            <Download className="mr-2 h-4 w-4" />
            CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadPDF} disabled={!data}>
            <Download className="mr-2 h-4 w-4" />
            PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadExcel} disabled={!data}>
            <Download className="mr-2 h-4 w-4" />
            Excel
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10">Loading...</div>
      ) : data && data.length > 0 ? (
        <DataTable columns={columns} data={data} onAdd={() => {}} onEdit={() => {}} onDelete={() => {}} />
      ) : (
        <div className="text-center py-10">No data available for the selected criteria.</div>
      )}
    </div>
  )
}

