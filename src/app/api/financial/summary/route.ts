import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Fetch financial summary for the consultancy
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(request.url)
    let studentId = searchParams.get('studentId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const consultancyId = session.user.consultancyId
    const userRole = session.user.role
    
    // Students can only see their own summary
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
    
    // Only ADMIN, COUNSELOR, and STUDENT can view financial summary
    if (!['ADMIN', 'COUNSELOR', 'STUDENT'].includes(userRole || '')) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Build date filter
    const dateFilter: any = {}
    if (startDate || endDate) {
      dateFilter.createdAt = {}
      if (startDate) {
        dateFilter.createdAt.gte = new Date(startDate)
      }
      if (endDate) {
        dateFilter.createdAt.lte = new Date(endDate)
      }
    }

    // Build student filter
    const studentFilter = studentId ? { studentId } : {}

    // Get fees summary
    const feesSummary = await prisma.fee.groupBy({
      by: ['type', 'status'],
      where: {
        consultancyId,
        ...studentFilter,
        ...dateFilter,
      },
      _sum: {
        amount: true,
        paidAmount: true,
      },
      _count: {
        id: true,
      },
    })

    // Get payments summary
    const paymentsSummary = await prisma.payment.groupBy({
      by: ['method', 'status'],
      where: {
        consultancyId,
        ...dateFilter,
        ...(studentId && {
          fee: {
            studentId,
          }
        }),
      },
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    })

    // Get office expenses summary
    const expensesSummary = await prisma.officeExpense.groupBy({
      by: ['category', 'expenseMode'],
      where: {
        consultancyId,
        ...dateFilter,
      },
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    })

    // Get total office expenses
    const totalExpenses = await prisma.officeExpense.aggregate({
      where: {
        consultancyId,
        ...dateFilter,
      },
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    })

    // Get upcoming payments (fees with due date in next 30 days)
    const upcomingPayments = await prisma.fee.findMany({
      where: {
        consultancyId,
        ...studentFilter,
        status: {
          in: ['PENDING', 'PARTIAL'],
        },
        dueDate: {
          gte: new Date(),
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        },
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
      },
      orderBy: {
        dueDate: 'asc',
      },
    })

    // Get overdue payments
    const overduePayments = await prisma.fee.findMany({
      where: {
        consultancyId,
        ...studentFilter,
        status: {
          in: ['PENDING', 'PARTIAL'],
        },
        dueDate: {
          lt: new Date(),
        },
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
      },
      orderBy: {
        dueDate: 'asc',
      },
    })

    // Calculate totals
    const totalFees = feesSummary.reduce((sum, group) => sum + (group._sum.amount || 0), 0)
    const totalPaid = feesSummary.reduce((sum, group) => sum + (group._sum.paidAmount || 0), 0)
    const totalOutstanding = totalFees - totalPaid

    // Group fees by type for summary
    const feesByType = feesSummary.reduce((acc, group) => {
      if (!acc[group.type]) {
        acc[group.type] = {
          totalAmount: 0,
          totalPaid: 0,
          count: 0,
        }
      }
      acc[group.type].totalAmount += group._sum.amount || 0
      acc[group.type].totalPaid += group._sum.paidAmount || 0
      acc[group.type].count += group._count.id || 0
      return acc
    }, {} as Record<string, { totalAmount: number; totalPaid: number; count: number }>)

    // Group fees by status for summary
    const feesByStatus = feesSummary.reduce((acc, group) => {
      if (!acc[group.status]) {
        acc[group.status] = {
          totalAmount: 0,
          count: 0,
        }
      }
      acc[group.status].totalAmount += group._sum.amount || 0
      acc[group.status].count += group._count.id || 0
      return acc
    }, {} as Record<string, { totalAmount: number; count: number }>)

    // Group payments by method for summary
    const paymentsByMethod = paymentsSummary.reduce((acc, group) => {
      if (!acc[group.method]) {
        acc[group.method] = {
          totalAmount: 0,
          count: 0,
        }
      }
      acc[group.method].totalAmount += group._sum.amount || 0
      acc[group.method].count += group._count.id || 0
      return acc
    }, {} as Record<string, { totalAmount: number; count: number }>)

    // Group expenses by category for summary
    const expensesByCategory = expensesSummary.reduce((acc, group) => {
      if (!acc[group.category]) {
        acc[group.category] = {
          totalAmount: 0,
          count: 0,
        }
      }
      acc[group.category].totalAmount += group._sum.amount || 0
      acc[group.category].count += group._count.id || 0
      return acc
    }, {} as Record<string, { totalAmount: number; count: number }>)

    // Group expenses by mode for summary
    const expensesByMode = expensesSummary.reduce((acc, group) => {
      if (!acc[group.expenseMode]) {
        acc[group.expenseMode] = {
          totalAmount: 0,
          count: 0,
        }
      }
      acc[group.expenseMode].totalAmount += group._sum.amount || 0
      acc[group.expenseMode].count += group._count.id || 0
      return acc
    }, {} as Record<string, { totalAmount: number; count: number }>)

    const summary = {
      overview: {
        totalFees,
        totalPaid,
        totalOutstanding,
        totalFeesCount: feesSummary.reduce((sum, group) => sum + (group._count.id || 0), 0),
        upcomingPaymentsCount: upcomingPayments.length,
        overduePaymentsCount: overduePayments.length,
        totalExpenses: totalExpenses._sum.amount || 0,
        totalExpensesCount: totalExpenses._count.id || 0,
      },
      feesByType,
      feesByStatus,
      paymentsByMethod,
      expensesByCategory,
      expensesByMode,
      upcomingPayments,
      overduePayments,
    }

    return NextResponse.json(summary)
  } catch (error) {
    console.error("Error fetching financial summary:", error)
    return NextResponse.json(
      { error: "Failed to fetch financial summary" },
      { status: 500 }
    )
  }
}
