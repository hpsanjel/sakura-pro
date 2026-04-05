import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Validation schema for creating a payment
const createPaymentSchema = z.object({
  feeId: z.string(),
  amount: z.number().positive("Amount must be positive"),
  method: z.enum(["CASH", "BANK_TRANSFER", "CREDIT_CARD", "ONLINE_PAYMENT", "CHEQUE", "OTHER"]),
  transactionId: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  receiptUrls: z.array(z.string()).optional(),
  transferDetails: z.object({
    bankName: z.string().nullable().optional(),
    accountNumber: z.string().nullable().optional(),
    accountHolder: z.string().nullable().optional(),
    transferDate: z.string().nullable().optional(),
    referenceNumber: z.string().nullable().optional(),
    fromAccount: z.string().nullable().optional(),
  }).nullable().optional(),
})

// GET - Fetch all payments for the consultancy
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(request.url)
    let studentId = searchParams.get('studentId')
    const feeId = searchParams.get('feeId')
    const status = searchParams.get('status')
    const method = searchParams.get('method')
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const consultancyId = session.user.consultancyId
    const userRole = session.user.role
    
    // Students can only see their own payments
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
    
    // Only ADMIN, COUNSELOR, and STUDENT can view payments
    if (!['ADMIN', 'COUNSELOR', 'STUDENT'].includes(userRole || '')) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Build where clause
    const where: any = {
      consultancyId,
    }
    
    if (feeId) {
      where.feeId = feeId
    }
    
    if (studentId) {
      where.fee = {
        studentId,
      }
    }
    
    if (status) {
      where.status = status
    }
    
    if (method) {
      where.method = method
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        fee: {
          select: {
            id: true,
            title: true,
            amount: true,
            paidAmount: true,
            student: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              }
            }
          }
        },
      },
      orderBy: {
        paymentDate: 'desc'
      }
    })

    return NextResponse.json(payments)
  } catch (error) {
    console.error("Error fetching payments:", error)
    return NextResponse.json(
      { error: "Failed to fetch payments" },
      { status: 500 }
    )
  }
}

// POST - Create a new payment
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only ADMIN and COUNSELOR can create payments
    if (!['ADMIN', 'COUNSELOR'].includes(session.user.role || '')) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = createPaymentSchema.parse(body)

    // Verify fee exists and belongs to consultancy
    const fee = await prisma.fee.findFirst({
      where: {
        id: validatedData.feeId,
        consultancyId: session.user.consultancyId,
      },
      include: {
        payments: {
          select: {
            amount: true,
          }
        }
      }
    })

    if (!fee) {
      return NextResponse.json({ error: "Fee not found" }, { status: 404 })
    }

    // Check if payment amount exceeds remaining amount
    const totalPaid = fee.payments.reduce((sum, payment) => sum + payment.amount, 0)
    const remainingAmount = fee.amount - totalPaid
    
    if (validatedData.amount > remainingAmount) {
      return NextResponse.json(
        { error: `Payment amount exceeds remaining amount of ${remainingAmount}` },
        { status: 400 }
      )
    }

    // Create payment
    const payment = await prisma.payment.create({
      data: {
        feeId: validatedData.feeId,
        amount: validatedData.amount,
        method: validatedData.method,
        transactionId: validatedData.transactionId || null,
        notes: validatedData.notes || null,
        receiptUrls: validatedData.receiptUrls || [],
        transferDetails: validatedData.transferDetails as any,
        receivedBy: session.user.id,
        consultancyId: session.user.consultancyId,
      },
      include: {
        fee: {
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
        },
      }
    })

    // Update fee status and paid amount
    const newTotalPaid = totalPaid + validatedData.amount
    let newStatus = fee.status
    
    if (newTotalPaid >= fee.amount) {
      newStatus = "PAID"
    } else if (newTotalPaid > 0) {
      newStatus = "PARTIAL"
    }

    await prisma.fee.update({
      where: { id: validatedData.feeId },
      data: {
        paidAmount: newTotalPaid,
        status: newStatus,
      }
    })

    return NextResponse.json(payment, { status: 201 })
  } catch (error) {
    console.error("Error creating payment:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "Failed to create payment" },
      { status: 500 }
    )
  }
}
