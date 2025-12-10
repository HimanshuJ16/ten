import { NextResponse } from 'next/server'
import { client } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()

    // Find the user by username
    const user = await client.user.findUnique({
      where: { username },
      include: { circle: true },
    })

    if (!user) {
      return NextResponse.json({ message: 'Invalid username or password' }, { status: 401 })
    }

    // Check if the password is correct
    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      return NextResponse.json({ message: 'Invalid username or password' }, { status: 401 })
    }

    // Generate a JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role, district: user.circle?.name },
      process.env.JWT_SECRET!,
      { expiresIn: '1d' }
    )

    // Return the token in the response body for the mobile app
    return NextResponse.json({
      message: 'Authentication successful',
      token, // Important: Send token to client
      district: user.circle?.name || 'unknown',
      role: user.role,
      id: user.id,
    })

  } catch (error) {
    console.error('Mobile Sign-in error:', error)
    return NextResponse.json({ message: 'An unexpected error occurred' }, { status: 500 })
  }
}
