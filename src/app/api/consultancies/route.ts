import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { sendNewConsultancyNotification } from "@/lib/email"

const createConsultancySchema = z.object({
  consultancyName: z.string().min(2, "Consultancy name must be at least 2 characters"),
  consultancyEmail: z.string().email("Invalid consultancy email"),
  consultancyPhone: z.string().optional(),
  consultancyAddress: z.string().optional(),
  adminName: z.string().min(2, "Admin name must be at least 2 characters"),
  adminEmail: z.string().email("Invalid admin email"),
  adminPassword: z.string().min(6, "Password must be at least 6 characters"),
})

export async function POST(req: NextRequest) {
  try {
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
      adminPassword,
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

    // Hash admin password
    const hashedPassword = await bcrypt.hash(adminPassword, 10)

    // Create consultancy and admin user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create consultancy with PENDING status
      const consultancy = await tx.consultancy.create({
        data: {
          name: consultancyName,
          email: consultancyEmail,
          phone: consultancyPhone,
          address: consultancyAddress,
          status: "PENDING",
        },
      })

      // Create admin user for the consultancy (but they can't log in until approved)
      const admin = await tx.user.create({
        data: {
          email: adminEmail,
          name: adminName,
          password: hashedPassword,
          role: "ADMIN",
          consultancyId: consultancy.id,
        },
      })

      return { consultancy, admin }
    })

    // Send notification email to superadmin (don't block on email failure)
    try {
      await sendNewConsultancyNotification(
        consultancyName,
        consultancyEmail,
        consultancyPhone || null,
        consultancyAddress || null
      )
    } catch (emailError) {
      console.error("Failed to send notification email:", emailError)
      // Continue anyway - registration succeeded
    }

    return NextResponse.json(
      {
        message: "Consultancy registration submitted successfully. You will receive an email once your registration is approved.",
        consultancy: {
          id: result.consultancy.id,
          name: result.consultancy.name,
          email: result.consultancy.email,
          status: result.consultancy.status,
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
