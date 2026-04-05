import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Fetch overall dashboard statistics
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

    // Fetch all statistics in parallel
    const [
      totalStudents,
      activeStudents,
      totalSchools,
      totalApplications,
      pendingApplications,
      approvedApplications,
      totalClasses,
      activeTeachers,
      recentEnrollments,
      documentsPending,
      documentsVerified
    ] = await Promise.all([
      // Total students for selected year
      prisma.student.count({
        where: { 
          consultancyId,
          ...yearFilter
        }
      }),
      
      // Active students for selected year (not rejected)
      prisma.student.count({
        where: { 
          consultancyId,
          visaStatus: { not: "REJECTED" },
          ...yearFilter
        }
      }),
      
      // Total schools (not year-filtered as schools are static)
      prisma.school.count({
        where: { consultancyId }
      }),
      
      // Total applications for selected year
      prisma.application.count({
        where: {
          school: { consultancyId },
          ...yearFilter
        }
      }),
      
      // Pending applications for selected year
      prisma.application.count({
        where: {
          school: { consultancyId },
          status: "PENDING",
          ...yearFilter
        }
      }),
      
      // Approved applications for selected year
      prisma.application.count({
        where: {
          school: { consultancyId },
          status: "ACCEPTED",
          ...yearFilter
        }
      }),
      
      // Total classes (not year-filtered as classes are ongoing)
      prisma.japaneseClass.count({
        where: {
          teacher: { consultancyId },
          isActive: true
        }
      }),
      
      // Active teachers (not year-filtered as teachers are ongoing)
      prisma.teacher.count({
        where: { consultancyId }
      }),
      
      // Recent enrollments for selected year
      prisma.classEnrollment.count({
        where: {
          class: {
            teacher: { consultancyId }
          },
          ...yearFilter
        }
      }),
      
      // Documents pending for selected year
      prisma.document.count({
        where: {
          student: { 
            consultancyId,
            ...yearFilter
          },
          status: "UPLOADED"
        }
      }),
      
      // Documents verified for selected year
      prisma.document.count({
        where: {
          student: { 
            consultancyId,
            ...yearFilter
          },
          status: "VERIFIED"
        }
      })
    ])

    const stats = {
      totalStudents,
      activeStudents,
      totalSchools,
      totalApplications,
      pendingApplications,
      approvedApplications,
      totalClasses,
      activeTeachers,
      recentEnrollments,
      documentsPending,
      documentsVerified
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Error fetching reports stats:", error)
    return NextResponse.json(
      { error: "Failed to fetch statistics" },
      { status: 500 }
    )
  }
}
