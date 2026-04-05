import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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

    const role = session.user.role

    // Get stats based on role
    if (role === "SUPERADMIN") {
      // Superadmin sees ALL data across all consultancies
      const [totalConsultancies, totalUsers, totalStudents, totalApplications, totalDocuments, totalSchools] = await Promise.all([
        prisma.consultancy.count(),
        prisma.user.count(),
        prisma.student.count(),
        prisma.application.count(),
        prisma.document.count(),
        prisma.school.count(),
      ])

      return NextResponse.json({
        totalConsultancies,
        totalUsers,
        totalStudents,
        totalApplications,
        totalDocuments,
        totalSchools,
      })
    } else if (role === "ADMIN") {
      // Admin sees all data for their consultancy filtered by year
      const [totalUsers, totalStudents, totalApplications, recentStudents] = await Promise.all([
        prisma.user.count({
          where: { consultancyId },
        }),
        prisma.student.count({
          where: { 
            consultancyId,
            ...yearFilter
          },
        }),
        prisma.application.count({
          where: {
            student: { 
              consultancyId,
              ...yearFilter
            },
          },
        }),
        prisma.student.findMany({
          where: { 
            consultancyId,
            ...yearFilter
          },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            name: true,
            passportNumber: true,
            phone: true,
            visaStatus: true,
            createdAt: true,
          },
        }),
      ])

      // Get application status breakdown for selected year
      const applicationsByStatus = await prisma.application.groupBy({
        by: ["status"],
        where: {
          student: { 
            consultancyId,
            ...yearFilter
          },
        },
        _count: true,
      })

      const statusCounts = {
        DRAFT: 0,
        SUBMITTED: 0,
        UNDER_REVIEW: 0,
        APPROVED: 0,
        REJECTED: 0,
        WITHDRAWN: 0,
      }

      applicationsByStatus.forEach((item) => {
        statusCounts[item.status as keyof typeof statusCounts] = item._count
      })

      return NextResponse.json({
        totalUsers,
        totalStudents,
        totalApplications,
        recentStudents,
        applicationsByStatus: statusCounts,
      })
    } else if (role === "COUNSELOR") {
      // Counselor sees all students in their consultancy filtered by year
      const [myStudents, pendingActions, completedApplications] = await Promise.all([
        prisma.student.count({
          where: { 
            consultancyId,
            ...yearFilter
          },
        }),
        prisma.application.count({
          where: {
            student: { 
              consultancyId,
              ...yearFilter
            },
            status: {
              in: ["SUBMITTED", "ACCEPTED"],
            },
          },
        }),
        prisma.application.count({
          where: {
            student: { 
              consultancyId,
              ...yearFilter
            },
            status: "ACCEPTED",
          },
        }),
      ])

      return NextResponse.json({
        myStudents,
        pendingActions,
        completedApplications,
      })
    } else if (role === "TEACHER") {
      // Teacher sees their class and student stats
      const [myClasses, totalStudents, scheduledInterviews, avgProgress] = await Promise.all([
        prisma.japaneseClass.count({
          where: { 
            teacherId: session.user.id,
            consultancyId,
            isActive: true 
          },
        }),
        prisma.classEnrollment.count({
          where: {
            class: {
              teacherId: session.user.id,
              consultancyId,
            },
            isActive: true,
          },
        }),
        prisma.interview.count({
          where: {
            teacherId: session.user.id,
            status: "SCHEDULED",
            scheduledAt: {
              gte: new Date(),
            },
          },
        }),
        prisma.studentProgress.aggregate({
          where: {
            enrollment: {
              class: {
                teacherId: session.user.id,
                consultancyId,
              },
            },
          },
          _avg: {
            overallScore: true,
          },
        }),
      ])

      return NextResponse.json({
        myClasses,
        totalStudents,
        scheduledInterviews,
        avgProgress: Math.round(avgProgress._avg.overallScore || 0),
      })
    } else if (role === "STUDENT") {
      // Student sees their own data
      // For now, return basic stats since Student model doesn't have userId link
      const [totalStudents, totalApplications, totalDocuments] = await Promise.all([
        prisma.student.count({
          where: { consultancyId },
        }),
        prisma.application.count({
          where: {
            student: { consultancyId },
          },
        }),
        prisma.document.count({
          where: {
            student: { consultancyId },
          },
        }),
      ])

      return NextResponse.json({
        myApplications: totalApplications,
        pendingDocuments: totalDocuments,
        upcomingDeadlines: 0,
      })
    }

    return NextResponse.json({ error: "Invalid role" }, { status: 400 })
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    return NextResponse.json(
      { error: "Failed to fetch dashboard statistics" },
      { status: 500 }
    )
  }
}
