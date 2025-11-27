"use client"

import { useState, useEffect } from "react"
import { DataTable, type Vehicle } from "./data-table"
import { useVehicles } from "@/hooks/vehicles/use-vehicles"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { getVendors } from "@/actions/vendors"
import type { VehicleSchemaType } from "@/schemas/vehicle.schema"
import { getUserRole } from "@/actions/settings"
import { Loader } from "../loader"
import type { ColumnDef } from "@tanstack/react-table"
import type React from "react"

const columns: ColumnDef<Vehicle>[] = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "address", header: "Address" },
  { accessorKey: "contactNumber", header: "Contact Number" },
  { accessorKey: "email", header: "Email" },
  { accessorKey: "vehicleNumber", header: "Vehicle Number" },
  { accessorKey: "vendor.username", header: "Vendor" },
  { accessorKey: "jen.username", header: "JEN" },
]

export default function VehiclesPage() {
  const { vehicles, onAddVehicle, onUpdateVehicle, onDeleteVehicle, loading } = useVehicles()
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [currentVehicle, setCurrentVehicle] = useState<Vehicle | null>(null)
  
  // State for file uploads
  const [rcFile, setRcFile] = useState<File | null>(null)
  const [licenseFile, setLicenseFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  const [formData, setFormData] = useState<Partial<Vehicle>>({
    name: "",
    address: "",
    contactNumber: "",
    email: "",
    vehicleNumber: "",
    vendorId: "",
    rcUrl: "",
    driverLicenseUrl: "",
  })
  
  const [vendors, setVendors] = useState<{ id: string; name: string; username: string }[]>([])
  const [userRole, setUserRole] = useState("")
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([])

  useEffect(() => {
    const fetchUserRoleAndVendors = async () => {
      const role = await getUserRole()
      setUserRole(role || "")

      const result = await getVendors()
      if (result.status === 200) {
        setVendors(result.data ?? [])
      } else {
        console.error("Error fetching vendors:", result.message)
      }
    }

    fetchUserRoleAndVendors()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prevData) => ({
      ...prevData,
      [name]: name === "vehicleNumber" ? value.toUpperCase() : value,
    }))
  }

  const handleSelectChange = (name: string) => (value: string) => {
    setFormData({ ...formData, [name]: value })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'rc' | 'license') => {
    if (e.target.files && e.target.files[0]) {
      if (type === 'rc') setRcFile(e.target.files[0])
      else setLicenseFile(e.target.files[0])
    }
  }

  const uploadToCloudinary = async (file: File, folder: string) => {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!) 
    formData.append("folder", folder)

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      )
      const data = await response.json()
      if (!response.ok) throw new Error(data.error?.message || "Upload failed")
      return data.secure_url
    } catch (error) {
      console.error("Upload error:", error)
      throw error
    }
  }

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault()
    setUploading(true)

    try {
      let rcUrl = formData.rcUrl
      let driverLicenseUrl = formData.driverLicenseUrl

      // Upload RC if selected
      if (rcFile) {
        rcUrl = await uploadToCloudinary(rcFile, "vehicle_rcs")
      }

      // Upload License if selected
      if (licenseFile) {
        driverLicenseUrl = await uploadToCloudinary(licenseFile, "driver_licenses")
      }

      await onAddVehicle({
        ...formData,
        rcUrl,
        driverLicenseUrl,
      } as VehicleSchemaType)

      setIsAddDialogOpen(false)
      // Reset form
      setFormData({
        name: "",
        address: "",
        contactNumber: "",
        email: "",
        vehicleNumber: "",
        vendorId: "",
        rcUrl: "",
        driverLicenseUrl: "",
      })
      setRcFile(null)
      setLicenseFile(null)
    } catch (error) {
      console.error("Failed to add vehicle:", error)
    } finally {
      setUploading(false)
    }
  }

  const handleUpdateVehicle = async (e: React.FormEvent) => {
    e.preventDefault()
    if (currentVehicle) {
      await onUpdateVehicle(currentVehicle.id, formData as VehicleSchemaType)
    }
    setIsEditDialogOpen(false)
    setCurrentVehicle(null)
    setFormData({
      name: "",
      address: "",
      contactNumber: "",
      email: "",
      vehicleNumber: "",
      vendorId: "",
      rcUrl: "",
      driverLicenseUrl: "",
    })
  }

  const handleDeleteVehicles = async (ids: string[]) => {
    if (window.confirm(`Are you sure you want to delete ${ids.length} vehicle(s)?`)) {
      for (const id of ids) {
        await onDeleteVehicle(id)
      }
      setSelectedVehicles([])
    }
  }

  const canEditDelete = userRole === "contractor"
  const canAddVehicle = userRole === "contractor" || userRole === "jen"

  return (
    <div className="space-y-4">
      <DataTable
        columns={columns}
        data={vehicles as Vehicle[]}
        onAdd={canAddVehicle ? () => setIsAddDialogOpen(true) : undefined}
        onEdit={
          canEditDelete
            ? (vehicle) => {
                setCurrentVehicle(vehicle)
                setFormData(vehicle)
                setIsEditDialogOpen(true)
              }
            : undefined
        }
        onDelete={handleDeleteVehicles}
        selectedVehicles={selectedVehicles}
        setSelectedVehicles={setSelectedVehicles}
      />

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Vehicle</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddVehicle} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" placeholder="Name" value={formData.name} onChange={handleInputChange} required />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                name="address"
                placeholder="Address"
                value={formData.address}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactNumber">Contact Number</Label>
              <Input
                id="contactNumber"
                name="contactNumber"
                placeholder="Contact Number"
                value={formData.contactNumber}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                placeholder="Email"
                type="email"
                value={formData.email || ""}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vehicleNumber">Vehicle Number</Label>
              <Input
                id="vehicleNumber"
                name="vehicleNumber"
                placeholder="Vehicle Number"
                value={formData.vehicleNumber}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vendorId">Vendor</Label>
              <Select name="vendorId" value={formData.vendorId || ""} onValueChange={handleSelectChange("vendorId")}>
                <SelectTrigger id="vendorId">
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="rc-upload">RC Document</Label>
              <Input 
                id="rc-upload" 
                type="file" 
                accept="image/*,.pdf"
                onChange={(e) => handleFileChange(e, 'rc')} 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="license-upload">Driver's License</Label>
              <Input 
                id="license-upload" 
                type="file" 
                accept="image/*,.pdf"
                onChange={(e) => handleFileChange(e, 'license')} 
              />
            </div>

            <Button type="submit" disabled={loading || uploading}>
              <Loader loading={loading || uploading}>
                {uploading ? "Uploading..." : "Submit"}
              </Loader>
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Vehicle</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateVehicle} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input id="edit-name" name="name" placeholder="Name" value={formData.name} onChange={handleInputChange} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-address">Address</Label>
              <Input
                id="edit-address"
                name="address"
                placeholder="Address"
                value={formData.address}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-contactNumber">Contact Number</Label>
              <Input
                id="edit-contactNumber"
                name="contactNumber"
                placeholder="Contact Number"
                value={formData.contactNumber}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                name="email"
                placeholder="Email"
                type="email"
                value={formData.email || ""}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-vehicleNumber">Vehicle Number</Label>
              <Input
                id="edit-vehicleNumber"
                name="vehicleNumber"
                placeholder="Vehicle Number"
                value={formData.vehicleNumber}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-vendorId">Vendor</Label>
              <Select name="vendorId" value={formData.vendorId || ""} onValueChange={handleSelectChange("vendorId")}>
                <SelectTrigger id="edit-vendorId">
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
            </div>

            <Button type="submit">Update Vehicle</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}