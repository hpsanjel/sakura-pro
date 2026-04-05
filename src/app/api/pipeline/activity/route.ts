import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Fetch recent pipeline activity
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only ADMIN and COUNSELOR can view activity
    if (session.user.role !== 'ADMIN' && session.user.role !== 'COUNSELOR') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get recent students with their visa status changes
    const students = await prisma.student.findMany({
      where: {
        consultancyId: session.user.consultancyId
      },
      select: {
        id: true,
        name: true,
        passportNumber: true,
        visaStatus: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: 20 // Get last 20 updates
    })

    // Create activity log from student updates
    const activities = students.map(student => ({
      id: `${student.id}-${student.updatedAt.getTime()}`,
      type: 'STATUS_UPDATE',
      studentId: student.id,
      studentName: student.name,
      studentPassport: student.passportNumber,
      oldStatus: null, // We don't track history in this simple implementation
      newStatus: student.visaStatus,
      timestamp: student.updatedAt,
      changedBy: session.user.email, // In a real app, you'd track who made the change
    }))

    return NextResponse.json(activities)
  } catch (error) {
    console.error("Error fetching pipeline activity:", error)
    return NextResponse.json(
      { error: "Failed to fetch pipeline activity" },
      { status: 500 }
    )
  }
}
