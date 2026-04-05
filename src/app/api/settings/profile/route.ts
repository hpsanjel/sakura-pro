import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Validation schema for updating profile
const updateProfileSchema = z.object({
  selectedYear: z.number().min(2020).max(2030)
})

// GET - Fetch user profile settings with consultancy year
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user and consultancy information
    const [user, consultancy] = await Promise.all([
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          consultancyId: true,
          createdAt: true
        }
      }),
      prisma.consultancy.findUnique({
        where: { id: session.user.consultancyId },
        select: {
          selectedYear: true
        }
      })
    ])

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (!consultancy) {
      return NextResponse.json({ error: "Consultancy not found" }, { status: 404 })
    }

    // Return user profile with consultancy year
    return NextResponse.json({
      ...user,
      selectedYear: consultancy.selectedYear // Use consultancy year instead of individual year
    })
  } catch (error) {
    console.error("Error fetching profile settings:", error)
    return NextResponse.json(
      { error: "Failed to fetch profile settings" },
      { status: 500 }
    )
  }
}
