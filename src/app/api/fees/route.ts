import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Validation schema for creating a fee
const createFeeSchema = z.object({
  studentId: z.string(),
  type: z.enum(["TUITION", "CONSULTANCY", "APPLICATION", "VISA", "ACCOMMODATION", "OTHER"]),
  title: z.string().min(1, "Title is required"),
  description: z.string().nullable().optional(),
  amount: z.number().positive("Amount must be positive"),
  dueDate: z.string().transform((str) => new Date(str)),
})

// Validation schema for updating a fee
const updateFeeSchema = z.object({
  title: z.string().optional(),
  description: z.string().nullable().optional(),
  amount: z.number().positive().optional(),
  dueDate: z.string().transform((str) => new Date(str)).optional(),
  status: z.enum(["PENDING", "PARTIAL", "PAID", "OVERDUE", "CANCELLED", "REFUNDED"]).optional(),
  paidAmount: z.number().min(0).optional(),
})

// GET - Fetch all fees for the consultancy
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(request.url)
    let studentId = searchParams.get('studentId')
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const consultancyId = session.user.consultancyId
    const userRole = session.user.role
    
    // Students can only see their own fees
    if (userRole === "STUDENT") {
      const student = await prisma.student.findUnique({
        where: { userId: session.user.id },
        select: { id: true }
      })
      
      if (!student) {
        return NextResponse.json({ error: "Student not found" }, { status: 404 })
      }
      
      studentId = student.id
    }
    
    // Only ADMIN, COUNSELOR, and STUDENT can view fees
    if (!['ADMIN', 'COUNSELOR', 'STUDENT'].includes(userRole || '')) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Build where clause
    const where: any = {
      consultancyId,
    }
    
    if (studentId) {
      where.studentId = studentId
    }
    
    if (status) {
      where.status = status
    }
    
    if (type) {
      where.type = type
    }

    const fees = await prisma.fee.findMany({
      where,
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
        _count: {
          select: {
            payments: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(fees)
  } catch (error) {
    console.error("Error fetching fees:", error)
    return NextResponse.json(
      { error: "Failed to fetch fees" },
      { status: 500 }
    )
  }
}

// POST - Create a new fee
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only ADMIN and COUNSELOR can create fees
    if (!['ADMIN', 'COUNSELOR'].includes(session.user.role || '')) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = createFeeSchema.parse(body)

    // Verify student belongs to the consultancy
    const student = await prisma.student.findFirst({
      where: {
        id: validatedData.studentId,
        consultancyId: session.user.consultancyId
      }
    })

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    const fee = await prisma.fee.create({
      data: {
        ...validatedData,
        consultancyId: session.user.consultancyId,
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          }
        }
      }
    })

    return NextResponse.json(fee, { status: 201 })
  } catch (error) {
    console.error("Error creating fee:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "Failed to create fee" },
      { status: 500 }
    )
  }
}
