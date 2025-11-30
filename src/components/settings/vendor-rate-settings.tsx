'use client'

import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { getVendors, updateVendorRate } from '@/actions/vendors'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Section from '../section-label'

const schema = z.object({
  vendorId: z.string().min(1, 'Please select a vendor'),
  rate: z.string().min(1, 'Rate is required').transform((val) => parseFloat(val)),
})

type FormData = z.infer<typeof schema>

const VendorRateSettings = () => {
  const [vendors, setVendors] = useState<{ id: string; name: string; username: string }[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    const fetchVendors = async () => {
      const result = await getVendors()
      if (result.status === 200 && result.data) {
        setVendors(result.data as any[])
      }
    }
    fetchVendors()
  }, [])

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const res = await updateVendorRate(data.vendorId, data.rate)
      if (res.status === 200) {
        toast({ title: 'Success', description: 'Vendor rate updated successfully' })
      } else {
        toast({ title: 'Error', description: res.message, variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Something went wrong', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const selectedVendorId = watch('vendorId')

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
      <div className="lg:col-span-1">
        <Section
          label="Vendor Rates"
          message="Update trip rates for specific vendors."
        />
      </div>
      <div className="lg:col-span-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 lg:w-[500px]">
          <div className="space-y-2">
            <Label>Select Vendor</Label>
            <Select onValueChange={(val) => setValue('vendorId', val)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a vendor" />
              </SelectTrigger>
              <SelectContent>
                {vendors.map((vendor) => (
                  <SelectItem key={vendor.id} value={vendor.id}>
                    {vendor.name} ({vendor.username})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.vendorId && <p className="text-sm text-red-500">{errors.vendorId.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Rate per Trip (₹)</Label>
            <Input 
              type="number" 
              placeholder="Enter amount" 
              {...register('rate')} 
            />
            {errors.rate && <p className="text-sm text-red-500">{errors.rate.message}</p>}
          </div>

          <Button type="submit" disabled={loading || !selectedVendorId}>
            {loading ? 'Updating...' : 'Update Rate'}
          </Button>
        </form>
      </div>
    </div>
  )
}

export default VendorRateSettings