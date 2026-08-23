import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Fetch recent activity
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

    // Get recent students for selected year
    const recentStudents = await prisma.student.findMany({
      where: { 
        consultancyId,
        ...yearFilter
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        name: true,
        createdAt: true
      }
    })

    // Get recent applications for selected year
    const recentApplications = await prisma.application.findMany({
      where: {
        school: { consultancyId },
        appliedAt: {
          gte: new Date(`${selectedYear}-01-01`),
          lt: new Date(`${selectedYear + 1}-01-01`)
        }
      },
      orderBy: { appliedAt: 'desc' },
      take: 5,
      include: {
        student: {
          select: {
            name: true
          }
        }
      }
    })

    // Get recent document uploads for selected year (only actually uploaded documents)
    const recentDocuments = await prisma.document.findMany({
      where: {
        student: { consultancyId },
        uploadedAt: {
          gte: new Date(`${selectedYear}-01-01`),
          lt: new Date(`${selectedYear + 1}-01-01`)
        } // implicitly excludes documents that were never uploaded (null)
      },
      orderBy: { uploadedAt: 'desc' },
      take: 5,
      include: {
        student: {
          select: {
            name: true
          }
        }
      }
    })

    // Combine and format activity data
    const activities: Array<{
      id: string
      type: string
      description: string
      timestamp: string
      user: string
    }> = []

    // Add student activities
    recentStudents.forEach(student => {
      activities.push({
        id: `student-${student.id}`,
        type: 'student_added',
        description: `New student added: ${student.name}`,
        timestamp: student.createdAt.toISOString(),
        user: 'System'
      })
    })

    // Add application activities
    recentApplications.forEach(application => {
      activities.push({
        id: `application-${application.id}`,
        type: 'application_submitted',
        description: `Application submitted for ${application.student.name}`,
        timestamp: application.appliedAt.toISOString(),
        user: application.student.name
      })
    })

    // Add document activities
    recentDocuments.forEach(document => {
      activities.push({
        id: `document-${document.id}`,
        type: 'document_uploaded',
        description: `Document uploaded: ${document.type} for ${document.student.name}`,
        timestamp: document.uploadedAt!.toISOString(), // Safe because we filtered for non-null
        user: document.student.name
      })
    })

    // Sort by timestamp (most recent first) and take latest 20
    const sortedActivities = activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 20)

    return NextResponse.json(sortedActivities)
  } catch (error) {
    console.error("Error fetching recent activity:", error)
    return NextResponse.json(
      { error: "Failed to fetch recent activity" },
      { status: 500 }
    )
  }
}
