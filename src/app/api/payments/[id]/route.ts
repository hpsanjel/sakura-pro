import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Validation schema for updating a payment
const updatePaymentSchema = z.object({
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
  paymentDate: z.string().optional(),
})

// PUT - Update a payment
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only ADMIN and COUNSELOR can update payments
    if (!['ADMIN', 'COUNSELOR'].includes(session.user.role || '')) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const paymentId = id
    const body = await request.json()
    const validatedData = updatePaymentSchema.parse(body)

    // Verify payment exists and belongs to the consultancy
    const existingPayment = await prisma.payment.findFirst({
      where: { 
        id: paymentId,
        consultancyId: session.user.consultancyId
      },
      include: {
        fee: {
          include: {
            student: true
          }
        }
      }
    })

    if (!existingPayment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    // Calculate new fee paid amount
    const otherPaymentsTotal = await prisma.payment.aggregate({
      where: {
        feeId: existingPayment.feeId,
        id: { not: paymentId },
        consultancyId: session.user.consultancyId
      },
      _sum: { amount: true }
    })

    const otherPayments = otherPaymentsTotal._sum.amount || 0
    const newPaidAmount = otherPayments + validatedData.amount

    // Validate that new amount doesn't exceed fee total
    if (newPaidAmount > existingPayment.fee.amount) {
      return NextResponse.json(
        { error: `Total payments cannot exceed fee amount of ${existingPayment.fee.amount}` },
        { status: 400 }
      )
    }

    // Update payment
    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        amount: validatedData.amount,
        method: validatedData.method,
        transactionId: validatedData.transactionId || null,
        notes: validatedData.notes || null,
        receiptUrls: validatedData.receiptUrls || [],
        transferDetails: validatedData.transferDetails as any,
        paymentDate: validatedData.paymentDate ? new Date(validatedData.paymentDate) : existingPayment.paymentDate,
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
    let newFeeStatus = "PENDING"
    if (newPaidAmount >= existingPayment.fee.amount) {
      newFeeStatus = "PAID"
    } else if (newPaidAmount > 0) {
      newFeeStatus = "PARTIAL"
    }

    await prisma.fee.update({
      where: { id: existingPayment.feeId },
      data: {
        paidAmount: newPaidAmount,
        status: newFeeStatus as any,
      }
    })

    return NextResponse.json(updatedPayment)
  } catch (error) {
    console.error("Payment update error:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "Failed to update payment" },
      { status: 500 }
    )
  }
}

// DELETE - Delete a payment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only ADMIN can delete payments
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const paymentId = id

    // Verify payment exists and belongs to the consultancy
    const existingPayment = await prisma.payment.findFirst({
      where: { 
        id: paymentId,
        consultancyId: session.user.consultancyId
      },
      include: {
        fee: true
      }
    })

    if (!existingPayment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    // Calculate new fee paid amount after deletion
    const otherPaymentsTotal = await prisma.payment.aggregate({
      where: {
        feeId: existingPayment.feeId,
        id: { not: paymentId },
        consultancyId: session.user.consultancyId
      },
      _sum: { amount: true }
    })

    const newPaidAmount = otherPaymentsTotal._sum.amount || 0

    // Update fee status and paid amount
    let newFeeStatus = "PENDING"
    if (newPaidAmount >= existingPayment.fee.amount) {
      newFeeStatus = "PAID"
    } else if (newPaidAmount > 0) {
      newFeeStatus = "PARTIAL"
    }

    await prisma.fee.update({
      where: { id: existingPayment.feeId },
      data: {
        paidAmount: newPaidAmount,
        status: newFeeStatus as any,
      }
    })

    // Delete the payment
    await prisma.payment.delete({
      where: { id: paymentId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Payment deletion error:", error)
    return NextResponse.json(
      { error: "Failed to delete payment" },
      { status: 500 }
    )
  }
}
