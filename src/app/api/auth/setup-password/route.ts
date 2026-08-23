import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { validateSetupToken, consumeSetupToken } from "@/lib/tokens"

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

    // Validate the setup token
    const tokenData = await validateSetupToken(token)
    if (!tokenData) {
      return NextResponse.json(
        { error: "Invalid or expired setup link" },
        { status: 400 }
      )
    }

    console.log(`Setting up password for ${tokenData.role}: ${tokenData.email}`)

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Update the user's password
    const user = await prisma.user.update({
      where: { id: tokenData.userId },
      data: {
        password: hashedPassword
      }
    })

    // Role-specific updates
    if (tokenData.role === 'STUDENT') {
      // Update student to mark that they've set their password
      await prisma.student.update({
        where: { userId: tokenData.userId },
        data: {
          loginSentAt: new Date() // Update to show password was set
        }
      })
    } else if (tokenData.role === 'ADMIN') {
      // For consultancy admins, we might want to mark that they've completed setup
      // This could be used for tracking purposes
      console.log(`Admin ${tokenData.email} has completed password setup`)
    }

    // Consume the token so it can't be used again
    await consumeSetupToken(token)

    console.log(`Password updated successfully for: ${tokenData.email}`)

    return NextResponse.json({
      message: "Password set successfully",
      email: tokenData.email,
      role: tokenData.role
    })

  } catch (error) {
    console.error("Error setting up password:", error)
    return NextResponse.json(
      { error: "Failed to set password" },
      { status: 500 }
    )
  }
}
