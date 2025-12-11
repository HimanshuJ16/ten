import { NextResponse } from 'next/server'
import { getVehicles, addVehicle } from '@/actions/vehicles'

export async function GET() {
  try {
    const vehicles = await getVehicles()

    if (vehicles === null) {
      return NextResponse.json({ message: 'Failed to fetch vehicles or unauthorized' }, { status: 401 })
    }

    return NextResponse.json(vehicles)
  } catch (error) {
    console.error('Mobile GET Vehicles error:', error)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}

const uploadToCloudinary = async (file: File, folder: string) => {
  const formData = new FormData()
  formData.append("file", file)
  formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!)
  formData.append("folder", folder)

  try {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    if (!cloudName) throw new Error("Cloudinary cloud name not configured");

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
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

export async function POST(request: Request) {
  try {
    // Check Content-Type to decide how to parse
    const contentType = request.headers.get('content-type') || ''

    let body: any = {}
    let rcUrl = ''
    let driverLicenseUrl = ''

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()

      const vehicleNumber = formData.get('vehicleNumber') as string
      const driverName = formData.get('driverName') as string // Maps to 'name' in Schema/Action
      const address = formData.get('address') as string
      const driverContact = formData.get('driverContact') as string // Maps to 'contactNumber'
      const email = formData.get('email') as string
      const vendorId = formData.get('vendorId') as string

      const rcDocument = formData.get('rcDocument') as File | null
      const licenseDocument = formData.get('licenseDocument') as File | null

      if (rcDocument) {
        try {
          rcUrl = await uploadToCloudinary(rcDocument, "vehicle_rcs")
        } catch (e) {
          console.error("Failed to upload RC:", e)
          return NextResponse.json({ message: 'Failed to upload RC Document' }, { status: 500 })
        }
      }

      if (licenseDocument) {
        try {
          driverLicenseUrl = await uploadToCloudinary(licenseDocument, "driver_licenses")
        } catch (e) {
          console.error("Failed to upload License:", e)
          return NextResponse.json({ message: 'Failed to upload License Document' }, { status: 500 })
        }
      }

      body = {
        name: driverName,
        address,
        contactNumber: driverContact,
        email,
        vehicleNumber,
        vendorId,
        rcUrl,
        driverLicenseUrl
      }
    } else {
      body = await request.json()
    }

    const result = await addVehicle(body)

    if (!result) {
      return NextResponse.json({ message: 'Unknown error occurred' }, { status: 500 })
    }

    return NextResponse.json(result, { status: result.status })
  } catch (error) {
    console.error('Mobile POST Vehicle error:', error)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}
