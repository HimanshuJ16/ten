import { NextResponse } from 'next/server'
import { getVendors } from '@/actions/reports'

export async function GET() {
  try {
    const result = await getVendors()
    return NextResponse.json(result, { status: result.status })
  } catch (error) {
    console.error('Mobile GET Report Vendors error:', error)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}
