import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { createYearFilter } from "@/lib/year-filter"

// Validation schema for creating progress
const createProgressSchema = z.object({
  speakingScore: z.number().min(0).max(100).optional(),
  listeningScore: z.number().min(0).max(100).optional(),
  readingScore: z.number().min(0).max(100).optional(),
  writingScore: z.number().min(0).max(100).optional(),
  attendanceRate: z.number().min(0).max(100).optional(),
  notes: z.string().optional(),
})

// POST - Create new progress record for specific enrollment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ enrollmentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { enrollmentId } = await params
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only TEACHER can create progress
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

    const body = await request.json()
    const validatedData = createProgressSchema.parse(body)

    // Verify enrollment belongs to teacher's class
    const enrollment = await prisma.classEnrollment.findFirst({
      where: {
        id: enrollmentId,
        class: {
          teacherId: teacher.id,
          consultancyId: session.user.consultancyId,
        },
      },
      include: {
        class: true,
        student: true,
      },
    })

    if (!enrollment) {
      return NextResponse.json({ error: "Enrollment not found or access denied" }, { status: 404 })
    }

    // Calculate overall score if individual scores provided
    let overallScore: number | undefined
    const scores = [
      validatedData.speakingScore,
      validatedData.listeningScore,
      validatedData.readingScore,
      validatedData.writingScore,
    ].filter((score): score is number => score !== undefined)

    if (scores.length > 0) {
      overallScore = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
    }

    const progress = await prisma.studentProgress.create({
      data: {
        enrollmentId: enrollmentId,
        speakingScore: validatedData.speakingScore,
        listeningScore: validatedData.listeningScore,
        readingScore: validatedData.readingScore,
        writingScore: validatedData.writingScore,
        overallScore,
        attendanceRate: validatedData.attendanceRate,
        notes: validatedData.notes,
      },
      include: {
        enrollment: {
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
          },
        },
      },
    })

    return NextResponse.json(progress, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      )
    }

    console.error("Error creating progress:", error)
    return NextResponse.json(
      { error: "Failed to create progress" },
      { status: 500 }
    )
  }
}

// GET - Get progress history for specific enrollment
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ enrollmentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { enrollmentId } = await params
    
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

    // Get consultancy's selected year (consultancy-wide year)
    const consultancy = await prisma.consultancy.findUnique({
      where: { id: session.user.consultancyId },
      select: { selectedYear: true }
    })

    if (!consultancy) {
      return NextResponse.json({ error: "Consultancy not found" }, { status: 404 })
    }

    // Create year filter based on consultancy selected year
    const yearFilter = createYearFilter(consultancy.selectedYear)

    // Verify enrollment belongs to teacher's class and is in selected year
    const enrollment = await prisma.classEnrollment.findFirst({
      where: {
        id: enrollmentId,
        class: {
          teacherId: teacher.id,
          consultancyId: session.user.consultancyId,
        },
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
    })

    if (!enrollment) {
      return NextResponse.json({ error: "Enrollment not found or access denied" }, { status: 404 })
    }

    return NextResponse.json(enrollment)
  } catch (error) {
    console.error("Error fetching enrollment progress:", error)
    return NextResponse.json(
      { error: "Failed to fetch enrollment progress" },
      { status: 500 }
    )
  }
}
