import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Validation schema for updating a fee
const updateFeeSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  amount: z.number().positive().optional(),
  dueDate: z.string().transform((str) => new Date(str)).optional(),
  status: z.enum(["PENDING", "PARTIAL", "PAID", "OVERDUE", "CANCELLED", "REFUNDED"]).optional(),
  paidAmount: z.number().min(0).optional(),
})

// GET - Fetch a single fee
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const consultancyId = session.user.consultancyId
    const userRole = session.user.role

    // Only ADMIN, COUNSELOR, and STUDENT can view fees
    if (!['ADMIN', 'COUNSELOR', 'STUDENT'].includes(userRole || '')) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const fee = await prisma.fee.findFirst({
      where: {
        id,
        consultancyId,
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          }
        },
        payments: {
          orderBy: {
            paymentDate: 'desc'
          }
        },
      }
    })

    if (!fee) {
      return NextResponse.json({ error: "Fee not found" }, { status: 404 })
    }

    // Students can only see their own fees
    if (userRole === "STUDENT") {
      const student = await prisma.student.findUnique({
        where: { userId: session.user.id },
        select: { id: true }
      })
      
      if (!student || fee.studentId !== student.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }

    return NextResponse.json(fee)
  } catch (error) {
    console.error("Error fetching fee:", error)
    return NextResponse.json(
      { error: "Failed to fetch fee" },
      { status: 500 }
    )
  }
}

// PUT - Update a fee
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only ADMIN and COUNSELOR can update fees
    if (!['ADMIN', 'COUNSELOR'].includes(session.user.role || '')) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = updateFeeSchema.parse(body)

    // Check if fee exists and belongs to consultancy
    const existingFee = await prisma.fee.findFirst({
      where: {
        id,
        consultancyId: session.user.consultancyId,
      }
    })

    if (!existingFee) {
      return NextResponse.json({ error: "Fee not found" }, { status: 404 })
    }

    const fee = await prisma.fee.update({
      where: { id },
      data: validatedData,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          }
        },
        payments: {
          orderBy: {
            paymentDate: 'desc'
          }
        },
      }
    })

    return NextResponse.json(fee)
  } catch (error) {
    console.error("Error updating fee:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "Failed to update fee" },
      { status: 500 }
    )
  }
}

// DELETE - Delete a fee
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only ADMIN can delete fees
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Check if fee exists and belongs to consultancy
    const existingFee = await prisma.fee.findFirst({
      where: {
        id,
        consultancyId: session.user.consultancyId,
      },
      include: {
        _count: {
          select: {
            payments: true,
          }
        }
      }
    })

    if (!existingFee) {
      return NextResponse.json({ error: "Fee not found" }, { status: 404 })
    }

    // Don't allow deletion if there are payments
    if (existingFee._count.payments > 0) {
      return NextResponse.json(
        { error: "Cannot delete fee with existing payments" },
        { status: 400 }
      )
    }

    await prisma.fee.delete({
      where: { id }
    })

    return NextResponse.json({ message: "Fee deleted successfully" })
  } catch (error) {
    console.error("Error deleting fee:", error)
    return NextResponse.json(
      { error: "Failed to delete fee" },
      { status: 500 }
    )
  }
}
