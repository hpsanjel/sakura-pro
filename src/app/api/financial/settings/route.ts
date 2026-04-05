import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Validation schema for financial settings
const updateSettingsSchema = z.object({
  consultancyFeePercent: z.number().min(0).max(100),
  tuitionFeeRange: z.string().min(1),
  paymentDueDays: z.number().min(1).max(365),
  lateFeePercent: z.number().min(0).max(100),
  currency: z.string().min(3).max(3),
})

// GET - Fetch financial settings for the consultancy
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only ADMIN can manage financial settings
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const consultancyId = session.user.consultancyId

    const settings = await prisma.financialSettings.findUnique({
      where: { consultancyId }
    })

    return NextResponse.json(settings)
  } catch (error) {
    console.error("Error fetching financial settings:", error)
    return NextResponse.json(
      { error: "Failed to fetch financial settings" },
      { status: 500 }
    )
  }
}

// PUT - Update financial settings for the consultancy
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only ADMIN can manage financial settings
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const consultancyId = session.user.consultancyId
    const body = await request.json()
    const validatedData = updateSettingsSchema.parse(body)

    // Upsert financial settings
    const settings = await prisma.financialSettings.upsert({
      where: { consultancyId },
      update: validatedData,
      create: {
        ...validatedData,
        consultancyId,
      }
    })

    return NextResponse.json(settings)
  } catch (error) {
    console.error("Error updating financial settings:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "Failed to update financial settings" },
      { status: 500 }
    )
  }
}
