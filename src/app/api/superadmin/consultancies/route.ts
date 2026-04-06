import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { sendConsultancyWelcomeEmail } from "@/lib/email"
import { generateSetupToken } from "@/lib/tokens"

const createConsultancySchema = z.object({
  consultancyName: z.string().min(2, "Consultancy name must be at least 2 characters"),
  consultancyEmail: z.string().email("Invalid consultancy email"),
  consultancyPhone: z.string().optional(),
  consultancyAddress: z.string().optional(),
  adminName: z.string().min(2, "Admin name must be at least 2 characters"),
  adminEmail: z.string().email("Invalid admin email"),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Forbidden - Super Admin access required" }, { status: 403 })
    }

    const body = await req.json()
    
    const validation = createConsultancySchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.issues },
        { status: 400 }
      )
    }

    const {
      consultancyName,
      consultancyEmail,
      consultancyPhone,
      consultancyAddress,
      adminName,
      adminEmail,
    } = validation.data

    // Check if consultancy email already exists
    const existingConsultancy = await prisma.consultancy.findUnique({
      where: { email: consultancyEmail },
    })

    if (existingConsultancy) {
      return NextResponse.json(
        { error: "A consultancy with this email already exists" },
        { status: 409 }
      )
    }

    // Check if admin email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: adminEmail },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 409 }
      )
    }

    // Create consultancy and admin user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create consultancy with ACTIVE status (since super admin is creating it directly)
      const consultancy = await tx.consultancy.create({
        data: {
          name: consultancyName,
          email: consultancyEmail,
          phone: consultancyPhone,
          address: consultancyAddress,
          status: "ACTIVE",
        },
      })

      // Create admin user for the consultancy with no password initially
      const admin = await tx.user.create({
        data: {
          email: adminEmail,
          name: adminName,
          password: null, // No password initially, admin will set it via email
          role: "ADMIN",
          consultancyId: consultancy.id,
        },
      })

      return { consultancy, admin }
    })

    // Generate setup token for the admin
    const setupToken = generateSetupToken(
      result.admin.id,
      result.admin.email,
      "ADMIN",
      result.consultancy.id
    )

    // Send welcome email with setup link (don't block on email failure)
    try {
      await sendConsultancyWelcomeEmail(
        result.consultancy.email,
        result.consultancy.name,
        result.admin.email,
        result.admin.name || "Admin",
        setupToken
      )
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError)
      // Continue anyway - consultancy creation succeeded
    }

    return NextResponse.json(
      {
        message: "Consultancy created successfully. Welcome email has been sent to the admin.",
        consultancy: {
          id: result.consultancy.id,
          name: result.consultancy.name,
          email: result.consultancy.email,
          status: result.consultancy.status,
        },
        admin: {
          id: result.admin.id,
          email: result.admin.email,
          name: result.admin.name,
          role: result.admin.role,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error creating consultancy:", error)
    return NextResponse.json(
      { error: "Failed to create consultancy" },
      { status: 500 }
    )
  }
}
