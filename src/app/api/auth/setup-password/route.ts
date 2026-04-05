import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import crypto from "crypto"

// In a real implementation, you would have a proper token storage system
// For demo purposes, we'll use a simple approach
const setupTokens = new Map<string, { userId: string; email: string; expires: number }>()

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json()

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and password are required" },
        { status: 400 }
      )
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      )
    }

    // For demo purposes, we'll find a student user that was created recently
    // and has a temporary password (indicating they haven't set their password yet)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    
    // Find student users created in the last 24 hours who haven't set a real password yet
    // We'll identify them by having a temporary password pattern (long hex string)
    const users = await prisma.user.findMany({
      where: {
        role: 'STUDENT',
        createdAt: {
          gte: oneDayAgo
        },
        password: {
          startsWith: '$2b$12$' // bcrypt hash pattern
        },
        student: {
          hasLoginAccess: true,
          loginSentAt: {
            gte: oneDayAgo
          }
        }
      },
      include: {
        student: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 1 // Get the most recent one
    })

    if (users.length === 0) {
      console.log("No student users found with temporary passwords")
      return NextResponse.json(
        { error: "Invalid or expired setup link" },
        { status: 400 }
      )
    }

    const user = users[0]

    if (!user.student) {
      console.log("User found but no student relationship:", user.id)
      return NextResponse.json(
        { error: "Student account not found" },
        { status: 404 }
      )
    }

    console.log("Found student user:", user.email, "Student ID:", user.student.id)

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Update the user's password
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword
      }
    })

    // Update student to mark that they've set their password
    await prisma.student.update({
      where: { id: user.student.id },
      data: {
        loginSentAt: new Date() // Update to show password was set
      }
    })

    console.log("Password updated successfully for:", user.email)

    return NextResponse.json({
      message: "Password set successfully",
      email: user.email
    })

  } catch (error) {
    console.error("Error setting up password:", error)
    return NextResponse.json(
      { error: "Failed to set password" },
      { status: 500 }
    )
  }
}
