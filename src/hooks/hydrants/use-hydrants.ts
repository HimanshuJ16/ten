import { useState, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import { getHydrants, addHydrant, updateHydrant, deleteHydrant } from '@/actions/hydrant'
import { Hydrant } from '@prisma/client'
import { HydrantSchemaType } from '@/schemas/hydrant.schema'

export const useHydrants = () => {
  const [hydrants, setHydrants] = useState<Hydrant[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const fetchHydrants = async () => {
    setLoading(true)
    const fetchedHydrants = await getHydrants()
    if (fetchedHydrants) {
      setHydrants(fetchedHydrants)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchHydrants()
  }, [])

  const onAddHydrant = async (data: HydrantSchemaType) => {
    setLoading(true)
    const normalizedData = {
      ...data,
      latitude: Number(data.latitude) || 0,
      longitude: Number(data.longitude) || 0,
    }

    const result = await addHydrant(normalizedData)
    if (result.status === 200) {
      toast({ title: 'Success', description: result.message })
      await fetchHydrants()
    } else {
      toast({ title: 'Error', description: result.message, variant: 'destructive' })
    }
    setLoading(false)
  }

  const onUpdateHydrant = async (id: string, data: HydrantSchemaType) => {
    setLoading(true)
    const normalizedData = {
      ...data,
      latitude: Number(data.latitude) || 0,
      longitude: Number(data.longitude) || 0,
    }

    const result = await updateHydrant(id, normalizedData)
    if (result.status === 200) {
      toast({ title: 'Success', description: result.message })
      await fetchHydrants()
    } else {
      toast({ title: 'Error', description: result.message, variant: 'destructive' })
    }
    setLoading(false)
  }

  const onDeleteHydrant = async (id: string) => {
    setLoading(true)
    const result = await deleteHydrant(id)
    if (result.status === 200) {
      toast({ title: 'Success', description: result.message })
      await fetchHydrants()
    } else {
      toast({ title: 'Error', description: result.message, variant: 'destructive' })
    }
    setLoading(false)
  }

  return {
    hydrants,
    loading,
    onAddHydrant,
    onUpdateHydrant,
    onDeleteHydrant
  }
}