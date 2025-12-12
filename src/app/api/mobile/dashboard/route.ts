import { NextResponse } from 'next/server'
import { getDashboardData } from '@/actions/dashboard'

export async function GET() {
  try {
    // You might want to pass dates via query params if needed, 
    // but default handles current day/range as per action logic.
    // However, getDashboardData logic defaults to TODAY if no dates provided.
    // If the mobile app dashboard is meant to show "Overall" or a specific range, 
    // we might need to adjust or pass null/undefined to get more.
    // Looking at the action: `const start = startDate ? startOfDay(startDate) : startOfDay(new Date());`
    // It defaults to TODAY.

    const result = await getDashboardData()

    if (!result || result.status !== 200) {
      return NextResponse.json({ message: result?.message || 'Failed to fetch data' }, { status: result?.status || 500 })
    }

    return NextResponse.json(result.data)
  } catch (error) {
    console.error('Mobile GET Dashboard error:', error)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}
