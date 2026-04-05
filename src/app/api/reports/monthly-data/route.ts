import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Fetch monthly data for trends
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only ADMIN can view reports
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const consultancyId = session.user.consultancyId

    // Get data for the last 12 months
    const twelveMonthsAgo = new Date()
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11)
    twelveMonthsAgo.setDate(1) // Set to first day of month

    // Process data into monthly format by querying each month individually
    const monthlyData = []
    const currentDate = new Date(twelveMonthsAgo)

    for (let i = 0; i < 12; i++) {
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59, 999)
      
      // Get students created in this month
      const studentsInMonth = await prisma.student.count({
        where: {
          consultancyId,
          createdAt: {
            gte: monthStart,
            lte: monthEnd
          }
        }
      })

      // Get applications in this month
      const applicationsInMonth = await prisma.application.count({
        where: {
          school: {
            consultancyId
          },
          appliedAt: {
            gte: monthStart,
            lte: monthEnd
          }
        }
      })

      monthlyData.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        students: studentsInMonth,
        applications: applicationsInMonth
      })

      currentDate.setMonth(currentDate.getMonth() + 1)
    }

    return NextResponse.json(monthlyData)
  } catch (error) {
    console.error("Error fetching monthly data:", error)
    return NextResponse.json(
      { error: "Failed to fetch monthly data" },
      { status: 500 }
    )
  }
}
