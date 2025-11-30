'use server'

import { client } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { verify } from 'jsonwebtoken'

interface JwtPayload {
  userId: string;
  username: string;
  role: string;
}

async function getCurrentUser() {
  const cookieStore = cookies()
  const token = (await cookieStore).get('token')?.value

  if (!token) return null

  try {
    const decoded = verify(token, process.env.JWT_SECRET!) as JwtPayload
    
    const dbUser = await client.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, district: true, username: true, role: true }
    })

    return dbUser
  } catch (error) {
    console.error('Error verifying token:', error)
    return null
  }
}

export const getVendors = async () => {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { status: 401, message: 'Unauthorized' };
  }

  try {
    let vendors;

    switch (currentUser.role) {
      case 'contractor':
        const contractor = await client.contractor.findUnique({
          where: { username: currentUser.username },
          include: { circle: { include: { vendors: true } } },
        })

        if (!contractor) {
          throw new Error('Contractor not found')
        }

        vendors = contractor.circle.vendors.map(vendor => ({
          id: vendor.id,
          name: vendor.name,
          username: vendor.username
        }))
        break

      case 'se':
        vendors = await client.vendor.findMany({
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
            jen: { include: { aen: { include: { xen: { include: { se: true } } } } } },
          },
        });
        break;

      case 'xen':
        vendors = await client.vendor.findMany({
          where: {
            jen: {
              aen: {
                xen: { username: currentUser.username },
              },
            },
          },
          include: {
            jen: { include: { aen: { include: { xen: true } } } },
          },
        });
        break;

      case 'aen':
        vendors = await client.vendor.findMany({
          where: {
            jen: {
              aen: { username: currentUser.username },
            },
          },
          include: {
            jen: { include: { aen: true } },
          },
        });
        break;

      case 'jen':
        vendors = await client.vendor.findMany({
          where: {
            jen: { username: currentUser.username },
          },
          include: {
            jen: true,
          },
        });
        break;

      case 'vendor':
        vendors = await client.vendor.findMany({
          where: {
            username: currentUser.username, // Only fetch the current vendor's details
          },
        });
        break;
        
      default:
        throw new Error('Unauthorized to fetch vendors');
    }

    return { status: 200, data: vendors };
  } catch (error) {
    console.error('Error fetching vendors:', error);
    return { status: 500, message: 'Internal server error' };
  }
};

export const getVendorDetails = async (vendorId: string) => {
  try {
    const vendorDetails = await client.vendor.findUnique({
      where: { id: vendorId },
      include: {
        customers: true,
        vehicles: true,
        hydrants: true,
        destinations: true,
      },
    })

    if (!vendorDetails) {
      throw new Error('Vendor not found')
    }

    return { status: 200, data: vendorDetails }
  } catch (error) {
    console.error('Error fetching vendor details:', error)
    return { status: 500, message: 'Internal server error' }
  }
}

export const updateVendorRate = async (vendorId: string, rate: number) => {
  try {
    const currentUser = await getCurrentUser();
    
    // 1. Basic Authorization Check
    if (!currentUser || currentUser.role !== 'contractor') {
      return { status: 401, message: 'Unauthorized' };
    }

    // 2. Fetch Contractor's Circle ID
    // We search by username because the User and Contractor models share the username.
    const contractor = await client.contractor.findUnique({
      where: { username: currentUser.username },
      select: { circleId: true }
    });

    if (!contractor) {
      return { status: 404, message: 'Contractor profile not found' };
    }

    // 3. Strict Verification: Check if Vendor exists AND belongs to the Contractor's Circle
    // We use findFirst with both 'id' and 'circleId' to ensure ownership.
    const existingVendor = await client.vendor.findFirst({
      where: {
        id: vendorId,
        circleId: contractor.circleId // [!code highlight] Strict security check
      }
    });

    if (!existingVendor) {
      return { status: 403, message: 'Action forbidden: Vendor does not belong to your circle.' };
    }

    // 4. Update the Rate
    await client.vendor.update({
      where: { id: vendorId },
      data: { ratePerTrip: rate },
    });

    return { status: 200, message: 'Rate updated successfully' };
  } catch (error) {
    console.error('Error updating vendor rate:', error);
    return { status: 500, message: 'Internal server error' };
  }
};