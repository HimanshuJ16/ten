import { NextResponse } from 'next/server'
import { getVendors } from '@/actions/vendors'

export async function GET() {
  try {
    const result = await getVendors()

    if (result.status !== 200) {
      return NextResponse.json({ message: result.message }, { status: result.status })
    }

    return NextResponse.json(result.data)
  } catch (error) {
    console.error('Mobile GET Vendors error:', error)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}
