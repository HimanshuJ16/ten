'use client'

import { useState, useEffect } from 'react'
import { DataTable, Hydrant } from './data-table'
import { useHydrants } from '@/hooks/hydrants/use-hydrants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getVendors } from '@/actions/vendors'
import { HydrantSchemaType } from '@/schemas/hydrant.schema'
import { getUserRole } from '@/actions/settings'
import { Loader } from '../loader'
import { ColumnDef } from "@tanstack/react-table"

const columns: ColumnDef<Hydrant>[] = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "address", header: "Address" },
  { accessorKey: "contactNumber", header: "Contact Number" },
  { accessorKey: "email", header: "Email" },
  { accessorKey: "latitude", header: "Latitude" },
  { accessorKey: "longitude", header: "Longitude" },
  { accessorKey: "vendor.username", header: "Vendor" },
  { accessorKey: "jen.username", header: "JEN" },
]

export default function HydrantsPage() {
  const { hydrants, onAddHydrant, onUpdateHydrant, onDeleteHydrant, loading } = useHydrants()
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [currentHydrant, setCurrentHydrant] = useState<Hydrant | null>(null)
  const [formData, setFormData] = useState<Partial<Hydrant>>({
    name: '',
    address: '',
    contactNumber: '',
    email: '',
    latitude: undefined,
    longitude: undefined,
    vendorId: '',
  })
  const [vendors, setVendors] = useState<{ id: string; name: string; username: string; }[]>([])
  const [userRole, setUserRole] = useState('')
  const [selectedHydrants, setSelectedHydrants] = useState<string[]>([])

  useEffect(() => {
    const fetchUserRoleAndVendors = async () => {
      const role = await getUserRole()
      setUserRole(role || '')

      const result = await getVendors()
      if (result.status === 200) {
        setVendors(result.data ?? [])
      } else {
        console.error('Error fetching vendors:', result.message)
      }
    }

    fetchUserRoleAndVendors()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
      ? e.target.name === 'latitude' || e.target.name === 'longitude'
        ? parseFloat(e.target.value)
        : e.target.value
      : null
    setFormData({ ...formData, [e.target.name]: value })
  }

  const handleSelectChange = (name: string) => (value: string) => {
    setFormData({ ...formData, [name]: value })
  }

  const handleAddHydrant = async (e: React.FormEvent) => {
    e.preventDefault()
    await onAddHydrant(formData as HydrantSchemaType)
    setIsAddDialogOpen(false)
    setFormData({
      name: '',
      address: '',
      contactNumber: '',
      email: '',
      latitude: undefined,
      longitude: undefined,
      vendorId: '',
    })
  }

  const handleUpdateHydrant = async (e: React.FormEvent) => {
    e.preventDefault()
    if (currentHydrant) {
      await onUpdateHydrant(currentHydrant.id, formData as HydrantSchemaType)
    }
    setIsEditDialogOpen(false)
    setCurrentHydrant(null)
    setFormData({
      name: '',
      address: '',
      contactNumber: '',
      email: '',
      latitude: undefined,
      longitude: undefined,
      vendorId: '',
    })
  }

  const handleDeleteHydrants = async (ids: string[]) => {
    if (window.confirm(`Are you sure you want to delete ${ids.length} hydrant(s)?`)) {
      for (const id of ids) {
        await onDeleteHydrant(id)
      }
      setSelectedHydrants([])
    }
  }

  const canEditDelete = userRole === 'contractor'
  const canAddHydrant = userRole === 'contractor' || userRole === 'jen'

  return (
    <div className="space-y-4">
      <DataTable
        columns={columns}
        data={hydrants as Hydrant[]}
        onAdd={canAddHydrant ? () => setIsAddDialogOpen(true) : undefined}
        onEdit={canEditDelete ? (hydrant) => {
          setCurrentHydrant(hydrant)
          setFormData(hydrant)
          setIsEditDialogOpen(true)
        } : undefined}
        onDelete={handleDeleteHydrants}
        selectedHydrants={selectedHydrants}
        setSelectedHydrants={setSelectedHydrants}
      />

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Hydrant</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddHydrant} className="space-y-4">
            <Input name="name" placeholder="Name" value={formData.name} onChange={handleInputChange} required />
            <Input name="address" placeholder="Address" value={formData.address} onChange={handleInputChange} required />
            <Input name="contactNumber" placeholder="Contact Number" value={formData.contactNumber} onChange={handleInputChange} required />
            <Input name="email" placeholder="Email" type="email" value={formData.email} onChange={handleInputChange} required />
            <Input name="latitude" placeholder="Latitude" type="number" value={formData.latitude ?? ''} onChange={handleInputChange} required />
            <Input name="longitude" placeholder="Longitude" type="number" value={formData.longitude ?? ''} onChange={handleInputChange} required />
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
            <Button type="submit">
              <Loader loading={loading}>Submit</Loader>
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Hydrant</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateHydrant} className="space-y-4">
            <Input name="name" placeholder="Name" value={formData.name} onChange={handleInputChange} required />
            <Input name="address" placeholder="Address" value={formData.address} onChange={handleInputChange} required />
            <Input name="contactNumber" placeholder="Contact Number" value={formData.contactNumber} onChange={handleInputChange} required />
            <Input name="email" placeholder="Email" type="email" value={formData.email} onChange={handleInputChange} required />
            <Input name="latitude" placeholder="Latitude" type="number" value={formData.latitude ?? ''} onChange={handleInputChange} required />
            <Input name="longitude" placeholder="Longitude" type="number" value={formData.longitude ?? ''} onChange={handleInputChange} required />
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
            <Button type="submit">Update Hydrant</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}