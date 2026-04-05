import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Fetch visa status distribution
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
    if (!consultancyId) {
      return NextResponse.json({ error: "Consultancy ID not found" }, { status: 400 })
    }

    // Get consultancy's selected year (consultancy-wide year)
    const consultancy = await prisma.consultancy.findUnique({
      where: { id: consultancyId },
      select: { selectedYear: true }
    })

    if (!consultancy) {
      return NextResponse.json({ error: "Consultancy not found" }, { status: 404 })
    }

    const selectedYear = consultancy.selectedYear

    // Create year filter for date-based queries
    const yearFilter = {
      createdAt: {
        gte: new Date(`${selectedYear}-01-01`),
        lt: new Date(`${selectedYear + 1}-01-01`)
      }
    }

    // Get visa status counts for selected year
    const visaStatusCounts = await prisma.student.groupBy({
      by: ['visaStatus'],
      where: { 
        consultancyId,
        ...yearFilter
      },
      _count: {
        visaStatus: true
      }
    })

    // Calculate total for percentages
    const total = visaStatusCounts.reduce((sum, item) => sum + item._count.visaStatus, 0)

    const visaStatusData = visaStatusCounts.map(item => ({
      status: item.visaStatus,
      count: item._count.visaStatus,
      percentage: total > 0 ? (item._count.visaStatus / total) * 100 : 0
    }))

    // Sort by count (descending)
    visaStatusData.sort((a, b) => b.count - a.count)

    return NextResponse.json(visaStatusData)
  } catch (error) {
    console.error("Error fetching visa status data:", error)
    return NextResponse.json(
      { error: "Failed to fetch visa status data" },
      { status: 500 }
    )
  }
}
