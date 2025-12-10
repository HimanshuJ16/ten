import { NextResponse } from 'next/server'
import { getCustomers, addCustomer } from '@/actions/customers'

export async function GET() {
  try {
    const customers = await getCustomers()

    if (customers === null) {
      return NextResponse.json({ message: 'Failed to fetch customers or unauthorized' }, { status: 401 })
    }

    return NextResponse.json(customers)
  } catch (error) {
    console.error('Mobile GET Customers error:', error)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const result = await addCustomer(body)

    return NextResponse.json(result, { status: result.status })
  } catch (error) {
    console.error('Mobile POST Customer error:', error)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}
