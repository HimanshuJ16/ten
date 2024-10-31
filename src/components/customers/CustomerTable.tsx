'use client'

import { useState, useEffect } from 'react'
import { DataTable, Customer } from './data-table'
import { useCustomers } from '@/hooks/customers/use-customers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getVendors } from '@/actions/customers'
import { CustomerSchemaType } from '@/schemas/customer.schema'
import { getUserRole } from '@/actions/settings'
import { Loader } from '../loader'
import { ColumnDef } from "@tanstack/react-table"

const columns: ColumnDef<Customer>[] = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "email", header: "Email" },
  { accessorKey: "contactNumber", header: "Contact Number" },
  { accessorKey: "address", header: "Address" },
  { accessorKey: "type", header: "Type" },
  { accessorKey: "vendor.username", header: "Vendor" },
  { accessorKey: "jen.username", header: "JEN" },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const approved = row.original.approved
      const active = row.original.active
      let status = "Inactive"
      if (approved && active) status = "Active"
      else if (approved && !active) status = "Inactive"
      else if (!approved) status = "Pending"
      return <span>{status}</span>
    }
  },
]

export default function CustomersPage() {
  const { customers, onAddCustomer, onUpdateCustomer, onDeleteCustomer, loading } = useCustomers()
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null)
  const [formData, setFormData] = useState<Partial<Customer>>({
    name: '',
    email: '',
    contactNumber: '',
    address: '',
    type: 'private',
    vendorId: '',
    approved: true,
    active: true,
  })
  const [vendors, setVendors] = useState<{ id: string; name: string; username: string; }[]>([]);
  const [userRole, setUserRole] = useState('')
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([])

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
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSelectChange = (name: string) => (value: string) => {
    setFormData({ ...formData, [name]: value })
  }

  const handleSwitchChange = (name: string) => (checked: boolean) => {
    setFormData({ ...formData, [name]: checked })
  }

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    await onAddCustomer(formData as CustomerSchemaType)
    setIsAddDialogOpen(false)
    setFormData({
      name: '',
      email: '',
      contactNumber: '',
      address: '',
      type: 'private',
      vendorId: '',
      approved: true,
      active: true,
    })
  }

  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (currentCustomer) {
      await onUpdateCustomer(currentCustomer.id, formData as CustomerSchemaType)
    }
    setIsEditDialogOpen(false)
    setCurrentCustomer(null)
    setFormData({
      name: '',
      email: '',
      contactNumber: '',
      address: '',
      type: 'private',
      vendorId: '',
      approved: true,
      active: true,
    })
  }

  const handleDeleteCustomers = async (ids: string[]) => {
    if (window.confirm(`Are you sure you want to delete ${ids.length} customer(s)?`)) {
      for (const id of ids) {
        await onDeleteCustomer(id)
      }
      setSelectedCustomers([])
    }
  }

  const canEditDelete = userRole === 'contractor'
  const canAddCustomer = userRole === 'contractor' || userRole === 'jen'

  return (
    <div className="space-y-4">
      <DataTable
        columns={columns}
        data={customers as Customer[]}
        onAdd={canAddCustomer ? () => setIsAddDialogOpen(true) : undefined}
        onEdit={canEditDelete ? (customer) => {
          setCurrentCustomer(customer)
          setFormData(customer)
          setIsEditDialogOpen(true)
        } : undefined}
        onDelete={handleDeleteCustomers}
        selectedCustomers={selectedCustomers}
        setSelectedCustomers={setSelectedCustomers}
      />

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Customer</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddCustomer} className="space-y-4">
            <Input name="name" placeholder="Name" value={formData.name} onChange={handleInputChange} required />
            <Input name="email" placeholder="Email" type="email" value={formData.email || ''} onChange={handleInputChange} />
            <Input name="contactNumber" placeholder="Contact Number" value={formData.contactNumber || ''} onChange={handleInputChange} required />
            <Input name="address" placeholder="Address" value={formData.address || ''} onChange={handleInputChange} required />
            <Select name="type" value={formData.type} onValueChange={handleSelectChange('type')}>
              <SelectTrigger>
                <SelectValue placeholder="Select customer type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="government">Government</SelectItem>
                <SelectItem value="private">Private</SelectItem>
              </SelectContent>
            </Select>
            <Select name="vendorId" value={formData.vendorId || ''} onValueChange={handleSelectChange('vendorId')}>
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
            <div className="flex items-center space-x-2">
              <Switch id="approved" checked={formData.approved} onCheckedChange={handleSwitchChange('approved')} />
              <label htmlFor="approved">Approved</label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="active" checked={formData.active} onCheckedChange={handleSwitchChange('active')} />
              <label htmlFor="active">Active</label>
            </div>
            <Button type="submit">
              <Loader loading={loading}>Submit</Loader>
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateCustomer} className="space-y-4">
            <Input name="name" placeholder="Name" value={formData.name} onChange={handleInputChange} required />
            <Input name="email" placeholder="Email" type="email" value={formData.email || ''} onChange={handleInputChange} />
            <Input name="contactNumber" placeholder="Contact Number" value={formData.contactNumber || ''} onChange={handleInputChange} required />
            <Input name="address" placeholder="Address" value={formData.address || ''} onChange={handleInputChange} required />
            <Select name="type" value={formData.type} onValueChange={handleSelectChange('type')}>
              <SelectTrigger>
                <SelectValue placeholder="Select customer type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="government">Government</SelectItem>
                <SelectItem value="private">Private</SelectItem>
              </SelectContent>
            </Select>
            <Select name="vendorId" value={formData.vendorId || ''} onValueChange={handleSelectChange('vendorId')}>
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
            <div className="flex items-center space-x-2">
              <Switch id="approved" checked={formData.approved} onCheckedChange={handleSwitchChange('approved')} />
              <label htmlFor="approved">Approved</label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="active" checked={formData.active} onCheckedChange={handleSwitchChange('active')} />
              <label htmlFor="active">Active</label>
            </div>
            <Button type="submit">Update Customer</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}