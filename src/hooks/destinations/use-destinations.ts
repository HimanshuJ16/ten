import { useState, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import { getDestinations, addDestination, updateDestination, deleteDestination } from '@/actions/destinations'
import { Destination } from '@prisma/client'
import { DestinationSchemaType } from '@/schemas/destination.schema'

export const useDestinations = () => {
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const fetchDestinations = async () => {
    setLoading(true)
    const fetchedDestinations = await getDestinations()
    if (fetchedDestinations) {
      setDestinations(fetchedDestinations)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchDestinations()
  }, [])

  const onAddDestination = async (data: DestinationSchemaType) => {
    setLoading(true)
    // Ensure latitude and longitude are numbers if they're provided; otherwise, set them to null
    const normalizedData = {
      ...data,
      latitude: Number(data.latitude) || 0,
      longitude: Number(data.longitude) || 0,
    }

    const result = await addDestination(normalizedData)
    if (result.status === 200) {
      toast({ title: 'Success', description: result.message })
      await fetchDestinations()
    } else {
      toast({ title: 'Error', description: result.message, variant: 'destructive' })
    }
    setLoading(false)
  }

  const onUpdateDestination = async (id: string, data: DestinationSchemaType) => {
    setLoading(true)
    const normalizedData = {
      ...data,
      latitude: Number(data.latitude) || 0,
      longitude: Number(data.longitude) || 0,
    }

    const result = await updateDestination(id, normalizedData)
    if (result.status === 200) {
      toast({ title: 'Success', description: result.message })
      await fetchDestinations()
    } else {
      toast({ title: 'Error', description: result.message, variant: 'destructive' })
    }
    setLoading(false)
  }

  const onDeleteDestination = async (id: string) => {
    setLoading(true)
    const result = await deleteDestination(id)
    if (result.status === 200) {
      toast({ title: 'Success', description: result.message })
      await fetchDestinations()
    } else {
      toast({ title: 'Error', description: result.message, variant: 'destructive' })
    }
    setLoading(false)
  }

  return {
    destinations,
    loading,
    onAddDestination,
    onUpdateDestination,
    onDeleteDestination
  }
}
