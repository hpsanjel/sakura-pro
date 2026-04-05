import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { createYearFilter, createYearFilterForField } from "@/lib/year-filter"

// Validation schema for creating progress (for main route, not used anymore)
const createProgressSchema = z.object({
  enrollmentId: z.string().min(1, "Enrollment ID is required"),
  speakingScore: z.number().min(0).max(100).optional(),
  listeningScore: z.number().min(0).max(100).optional(),
  readingScore: z.number().min(0).max(100).optional(),
  writingScore: z.number().min(0).max(100).optional(),
  attendanceRate: z.number().min(0).max(100).optional(),
  notes: z.string().optional(),
})

// GET - Fetch teacher's student progress
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only TEACHER can view progress
    if (session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get teacher record
    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
    })

    if (!teacher) {
      return NextResponse.json({ error: "Teacher profile not found" }, { status: 404 })
    }

    // Get consultancy's selected year
    const consultancy = await prisma.consultancy.findUnique({
      where: { id: session.user.consultancyId },
      select: { selectedYear: true }
    })

    if (!consultancy) {
      return NextResponse.json({ error: "Consultancy not found" }, { status: 404 })
    }

    // Create year filter based on consultancy selected year
    const yearFilter = createYearFilterForField(consultancy.selectedYear, 'enrolledAt')

    const enrollments = await prisma.classEnrollment.findMany({
      where: {
        class: {
          teacherId: teacher.id,
          consultancyId: session.user.consultancyId,
        },
        isActive: true,
        ...yearFilter, // Apply year filter to enrolledAt
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            passportNumber: true,
            japaneseLanguageLevel: true,
          },
        },
        class: {
          select: {
            id: true,
            name: true,
            level: true,
          },
        },
        progress: {
          orderBy: {
            assessmentDate: 'desc',
          },
        },
      },
      orderBy: {
        enrolledAt: 'desc',
      },
    })

    return NextResponse.json(enrollments)
  } catch (error) {
    console.error("Error fetching progress:", error)
    return NextResponse.json(
      { error: "Failed to fetch progress" },
      { status: 500 }
    )
  }
}
