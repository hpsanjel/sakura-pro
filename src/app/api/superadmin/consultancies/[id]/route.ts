import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sendConsultancyApprovalEmail, sendConsultancyRejectionEmail } from "@/lib/email"
import { z } from "zod"
import crypto from "crypto"

const updateStatusSchema = z.object({
  status: z.enum(["PENDING", "ACTIVE", "REJECTED"])
})

// PATCH - Approve/reject consultancies (existing functionality)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const { action, reason } = body

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    // Get consultancy with admin user
    const consultancy = await prisma.consultancy.findUnique({
      where: { id },
      include: {
        users: {
          where: { role: "ADMIN" },
          take: 1,
        },
      },
    })

    if (!consultancy) {
      return NextResponse.json({ error: "Consultancy not found" }, { status: 404 })
    }

    if (consultancy.status !== "PENDING") {
      return NextResponse.json(
        { error: "Consultancy has already been processed" },
        { status: 400 }
      )
    }

    const adminUser = consultancy.users[0]
    if (!adminUser) {
      return NextResponse.json(
        { error: "No admin user found for this consultancy" },
        { status: 400 }
      )
    }

    if (action === "approve") {
      // Update consultancy status to ACTIVE
      const updatedConsultancy = await prisma.consultancy.update({
        where: { id },
        data: { status: "ACTIVE" },
      })

      // Generate a temporary password for the admin (they should change it)
      const tempPassword = crypto.randomBytes(8).toString('hex')
      const bcrypt = require('bcryptjs')
      const hashedPassword = await bcrypt.hash(tempPassword, 10)

      // Update admin user password
      await prisma.user.update({
        where: { id: adminUser.id },
        data: { password: hashedPassword },
      })

      // Send approval email with credentials
      try {
        await sendConsultancyApprovalEmail(
          consultancy.email,
          consultancy.name,
          adminUser.email,
          tempPassword
        )
      } catch (emailError) {
        console.error("Failed to send approval email:", emailError)
        // Continue anyway - approval succeeded
      }

      return NextResponse.json({
        message: "Consultancy approved successfully",
        consultancy: updatedConsultancy,
      })
    } else {
      // Reject consultancy
      const updatedConsultancy = await prisma.consultancy.update({
        where: { id },
        data: { status: "REJECTED" },
      })

      // Send rejection email
      try {
        await sendConsultancyRejectionEmail(
          consultancy.email,
          consultancy.name,
          reason
        )
      } catch (emailError) {
        console.error("Failed to send rejection email:", emailError)
        // Continue anyway - rejection succeeded
      }

      return NextResponse.json({
        message: "Consultancy rejected",
        consultancy: updatedConsultancy,
      })
    }
  } catch (error) {
    console.error("Error processing consultancy:", error)
    return NextResponse.json(
      { error: "Failed to process consultancy" },
      { status: 500 }
    )
  }
}

// PUT - Update consultancy status (Super Admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Forbidden - Super Admin access required" }, { status: 403 })
    }

    const { id: consultancyId } = await params
    const body = await request.json()

    const validation = updateStatusSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.issues },
        { status: 400 }
      )
    }

    const { status } = validation.data

    // Check if consultancy exists
    const existingConsultancy = await prisma.consultancy.findUnique({
      where: { id: consultancyId },
    })

    if (!existingConsultancy) {
      return NextResponse.json({ error: "Consultancy not found" }, { status: 404 })
    }

    // Update consultancy status
    const updatedConsultancy = await prisma.consultancy.update({
      where: { id: consultancyId },
      data: { status },
      include: {
        _count: {
          select: {
            users: true,
            students: true,
            teachers: true,
            employees: true,
          },
        },
      },
    })

    return NextResponse.json({
      message: `Consultancy status updated to ${status}`,
      consultancy: updatedConsultancy,
    })
  } catch (error) {
    console.error("Error updating consultancy status:", error)
    return NextResponse.json(
      { error: "Failed to update consultancy status" },
      { status: 500 }
    )
  }
}

// DELETE - Delete a consultancy (Super Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Forbidden - Super Admin access required" }, { status: 403 })
    }

    const { id: consultancyId } = await params

    // Check if consultancy exists
    const existingConsultancy = await prisma.consultancy.findUnique({
      where: { id: consultancyId },
      include: {
        _count: {
          select: {
            users: true,
            students: true,
            teachers: true,
            employees: true,
          },
        },
      },
    })

    if (!existingConsultancy) {
      return NextResponse.json({ error: "Consultancy not found" }, { status: 404 })
    }

    // Prevent deletion if consultancy has active users/students
    if (existingConsultancy._count.users > 0 || 
        existingConsultancy._count.students > 0 || 
        existingConsultancy._count.teachers > 0 || 
        existingConsultancy._count.employees > 0) {
      return NextResponse.json({
        error: "Cannot delete consultancy with active users, students, teachers, or employees. Please deactivate them first."
      }, { status: 409 })
    }

    // Delete the consultancy
    await prisma.consultancy.delete({
      where: { id: consultancyId },
    })

    return NextResponse.json({ message: "Consultancy deleted successfully" })
  } catch (error) {
    console.error("Error deleting consultancy:", error)
    return NextResponse.json(
      { error: "Failed to delete consultancy" },
      { status: 500 }
    )
  }
}
