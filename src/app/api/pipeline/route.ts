import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { validateVisaStatusTransition } from "@/lib/visa-validation"

// Visa pipeline stages for Japan student visa
const VISA_STAGES = [
  "NEW_LEAD",
  "DOCS_PENDING", 
  "DOCS_VERIFIED",
  "SENT_TO_JAPAN",
  "COE_APPLIED",
  "COE_APPROVED", 
  "VISA_APPLIED",
  "VISA_APPROVED",
  "REJECTED"
] as const

// Validation schema for updating visa status
const updateVisaStatusSchema = z.object({
  studentId: z.string(),
  visaStatus: z.enum(VISA_STAGES),
  notes: z.string().optional(),
})

// GET - Fetch pipeline data for Kanban board
export async function GET(request: NextRequest) {
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

    // Only ADMIN and COUNSELOR can view pipeline
    if (session.user.role !== 'ADMIN' && session.user.role !== 'COUNSELOR') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get all students for the consultancy filtered by selected year with their documents
    const students = await prisma.student.findMany({
      where: {
        consultancyId: session.user.consultancyId,
        ...yearFilter
      },
      include: {
        documents: {
          select: {
            type: true,
            status: true,
          }
        },
        sponsors: {
          select: {
            name: true,
            relation: true,
          }
        },
        applications: {
          include: {
            school: {
              select: {
                name: true,
              }
            }
          }
        },
        enrollments: {
          where: { isActive: true },
          include: {
            class: {
              select: {
                name: true,
                level: true,
              }
            }
          }
        }
      },
      orderBy: [
        { visaStatus: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    // Calculate statistics with application-aware logic
    const stats = VISA_STAGES.reduce((acc, stage) => {
      acc[stage] = 0
      return acc
    }, {} as Record<string, number>)

    // Enhanced pipeline logic that considers application status
    const enhancedPipeline = VISA_STAGES.reduce((acc, stage) => {
      acc[stage] = []
      return acc
    }, {} as Record<string, typeof students>)

    for (const student of students) {
      let effectiveStatus = student.visaStatus

      // Check if student has accepted applications and should be in COE_APPLIED stage
      if (student.visaStatus === "SENT_TO_JAPAN" && 
          student.applications.some(app => app.status === "ACCEPTED")) {
        effectiveStatus = "COE_APPLIED"
      }
      // Check if student has all applications rejected and might need attention
      else if (student.applications.length > 0 && 
               student.applications.every(app => app.status === "REJECTED")) {
        // Keep student in current status but this could be used for alerts
        console.log(`Student ${student.name} has all applications rejected`)
      }

      // Add student to appropriate pipeline stage
      enhancedPipeline[effectiveStatus].push(student)
      stats[effectiveStatus]++
    }

    return NextResponse.json({
      pipeline: enhancedPipeline,
      stats,
      totalStudents: students.length
    })
  } catch (error) {
    console.error("Error fetching pipeline:", error)
    return NextResponse.json(
      { error: "Failed to fetch pipeline data" },
      { status: 500 }
    )
  }
}

// POST - Update student visa status (move between stages)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only ADMIN and COUNSELOR can update pipeline
    if (session.user.role !== 'ADMIN' && session.user.role !== 'COUNSELOR') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = updateVisaStatusSchema.parse(body)

    // Verify student belongs to the user's consultancy
    const student = await prisma.student.findFirst({
      where: {
        id: validatedData.studentId,
        consultancyId: session.user.consultancyId
      }
    })

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    // Validate visa status transition
    const validation = await validateVisaStatusTransition(
      validatedData.studentId,
      validatedData.visaStatus,
      student.visaStatus
    )

    if (!validation.isValid) {
      return NextResponse.json(
        { 
          error: "Visa status transition not allowed", 
          details: validation.errors,
          warnings: validation.warnings
        },
        { status: 400 }
      )
    }

    // Log warnings if any
    if (validation.warnings.length > 0) {
      console.log(`Pipeline status update warnings for student ${validatedData.studentId}:`, validation.warnings)
    }

    // Update student visa status
    const updatedStudent = await prisma.student.update({
      where: { id: validatedData.studentId },
      data: {
        visaStatus: validatedData.visaStatus,
      },
      include: {
        documents: true,
        sponsors: true,
        applications: {
          include: {
            school: true
          }
        }
      }
    })

    // Log the status change (you could create a separate log table)
    console.log(`Student ${updatedStudent.name} visa status updated to ${validatedData.visaStatus} by ${session.user.email}`)

    return NextResponse.json(updatedStudent)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      )
    }

    console.error("Error updating pipeline:", error)
    return NextResponse.json(
      { error: "Failed to update pipeline" },
      { status: 500 }
    )
  }
}
