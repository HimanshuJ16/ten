'use server'

import { PrismaClient } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { verify } from 'jsonwebtoken'

const prisma = new PrismaClient()

interface JwtPayload {
  userId: string;
  username: string;
  role: string;
}

interface HydrantData {
  name: string;
  address: string;
  contactNumber: string;
  email: string;
  latitude: number;
  longitude: number;
  vendorId: string;
}

async function getCurrentUser() {
  const cookieStore = cookies()
  const token = (await cookieStore).get('token')?.value

  if (!token) return null

  try {
    const decoded = verify(token, process.env.JWT_SECRET!) as JwtPayload
    
    const dbUser = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, district: true, username: true, role: true }
    })

    return dbUser
  } catch (error) {
    console.error('Error verifying token:', error)
    return null
  }
}

export const getHydrants = async () => {
  const currentUser = await getCurrentUser()
  if (!currentUser) return null

  try {
    let hydrants

    switch (currentUser.role) {
      case 'contractor':
        hydrants = await prisma.hydrant.findMany({
          where: {
            jen: {
              contractor: {
                username: currentUser.username
              }
            }
          },
          include: {
            vendor: true,
            jen: true
          }
        })
        break

      case 'se':
        hydrants = await prisma.hydrant.findMany({
          where: {
            jen: {
              aen: {
                xen: {
                  se: { username: currentUser.username },
                },
              },
            },
          },
          include: {
            vendor: true,
            jen: { include: { aen: { include: { xen: { include: { se: true } } } } } },
          },
        });
        break;

      case 'xen':
        hydrants = await prisma.hydrant.findMany({
          where: {
            jen: {
              aen: {
                xen: { username: currentUser.username },
              },
            },
          },
          include: {
            vendor: true,
            jen: { include: { aen: { include: { xen: true } } } },
          },
        });
        break;

      case 'aen':
        hydrants = await prisma.hydrant.findMany({
          where: {
            jen: {
              aen: { username: currentUser.username },
            },
          },
          include: {
            vendor: true,
            jen: { include: { aen: true } },
          },
        });
        break;    

      case 'jen':
        hydrants = await prisma.hydrant.findMany({
          where: {
            OR: [
              { jen: { username: currentUser.username } },
              { vendor: { jen: { username: currentUser.username } } }
            ]
          },
          include: {
            vendor: true,
            jen: true
          }
        })
        break

      case 'vendor':
        hydrants = await prisma.hydrant.findMany({
          where: {
            vendor: { username: currentUser.username }
          },
          include: {
            vendor: true,
            jen: true
          }
        })
        break

      default:
        throw new Error('Unauthorized to view hydrants')
    }

    return hydrants
  } catch (error) {
    console.error('Error fetching hydrants:', error)
    return null
  }
}

export const addHydrant = async (data: HydrantData) => {
  const currentUser = await getCurrentUser()
  if (!currentUser) return { status: 401, message: 'Unauthorized' }

  try {
    let newHydrant

    switch (currentUser.role) {
      case 'contractor':
      case 'jen':
        const user = await (prisma[currentUser.role] as any).findUnique({
          where: { username: currentUser.username },
          include: { circle: { include: { vendors: true } } },
        })

        if (!user) throw new Error(`${currentUser.role.toUpperCase()} not found`)

        const vendorInCircle = user.circle.vendors.find((v: any) => v.id === data.vendorId)
        if (!vendorInCircle) throw new Error('Vendor not found in user\'s circle')

        newHydrant = await prisma.hydrant.create({
          data: {
            name: data.name,
            address: data.address,
            contactNumber: data.contactNumber,
            email: data.email,
            latitude: data.latitude,
            longitude:  data.longitude,
            vendor: { connect: { id: data.vendorId } },
            jen: { connect: { id: currentUser.role === 'jen' ? user.id : vendorInCircle.jenId } },
          },
        })
        break

      default:
        throw new Error('Unauthorized to add hydrants')
    }

    revalidatePath('/hydrants')
    return { status: 200, message: 'Hydrant added successfully', data: newHydrant }
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error adding hydrant:', error)
      return { status: 500, message: error.message || 'Internal server error' }
    } else {
      console.error('Unknown error:', error)
      return { status: 500, message: 'Internal server error' }
    }
  }
}

export const updateHydrant = async (hydrantId: string, data: HydrantData) => {
  const currentUser = await getCurrentUser()
  if (!currentUser) return { status: 401, message: 'Unauthorized' }

  if (currentUser.role !== 'contractor') 
    return { status: 403, message: 'Only contractors can update hydrant details' }

  try {
    const contractor = await prisma.contractor.findUnique({
      where: { username: currentUser.username },
      include: { circle: { include: { vendors: true } } },
    })

    if (!contractor) throw new Error('Contractor not found')

    const hydrant = await prisma.hydrant.findUnique({
      where: { id: hydrantId },
      include: { vendor: true },
    })

    if (!hydrant) throw new Error('Hydrant not found')

    const vendorInCircle = contractor.circle.vendors.some(v => v.id === hydrant.vendor?.id)
    if (!vendorInCircle) throw new Error('Hydrant does not belong to a vendor in your circle')

    const updateData: any = {
      name: data.name,
      address: data.address,
      contactNumber: data.contactNumber,
      email: data.email,
      latitude: data.latitude,
      longitude: data.longitude,
    }

    if (data.vendorId) {
      const newVendor = contractor.circle.vendors.find(v => v.id === data.vendorId)
      if (!newVendor) throw new Error('New vendor not found in your circle')
      updateData.vendor = { connect: { id: data.vendorId } }
    }

    const updatedHydrant = await prisma.hydrant.update({
      where: { id: hydrantId },
      data: updateData,
    })

    revalidatePath('/hydrants')
    return { status: 200, message: 'Hydrant updated successfully', data: updatedHydrant }
  } catch (error) {
    console.error('Error updating hydrant:', error)
    if (error instanceof Error) {
      return { status: 500, message: error.message }
    }
    return { status: 500, message: 'Internal server error' }
  }
}

export const deleteHydrant = async (id: string) => {
  const currentUser = await getCurrentUser()
  if (!currentUser) return { status: 401, message: 'Unauthorized' }

  try {
    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
    })

    if (!user) throw new Error('User not found')

    const hydrant = await prisma.hydrant.findUnique({
      where: { id },
      include: { vendor: true, jen: true },
    })

    if (!hydrant) throw new Error('Hydrant not found')

    if (currentUser.role === 'contractor') {
      await prisma.hydrant.delete({
        where: { id },
      })
      revalidatePath('/hydrants')
      return { status: 200, message: 'Hydrant deleted successfully' }
    } else {
      throw new Error('Unauthorized to delete this hydrant')
    }
  } catch (error) {
    console.error('Error deleting hydrant:', error)
    return { status: 500, message: 'Internal server error' }
  }
}