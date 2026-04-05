import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Validation schema for creating an application
const createApplicationSchema = z.object({
  studentId: z.string().min(1, "Student ID is required"),
  schoolId: z.string().min(1, "School ID is required"),
  notes: z.string().optional(),
})

// GET - Fetch all applications for the consultancy
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')
    const status = searchParams.get('status')

    let where: any

    // Handle different user roles
    if (session.user.role === 'STUDENT') {
      // Students can only see their own applications
      where = {
        student: {
          userId: session.user.id
        }
      }
    } else if (session.user.role === 'ADMIN' || session.user.role === 'COUNSELOR') {
      // Admin/Counselor can see all applications in their consultancy
      where = {
        student: {
          consultancyId: session.user.consultancyId
        }
      }
      
      // If specific studentId is provided (for admin/counselor filtering)
      if (studentId) {
        where.studentId = studentId
      }
    } else {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (status) {
      where.status = status
    }

    const applications = await prisma.application.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            passportNumber: true,
            visaStatus: true
          }
        },
        school: {
          select: {
            id: true,
            name: true,
            isPartner: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(applications)
  } catch (error) {
    console.error("Error fetching applications:", error)
    return NextResponse.json(
      { error: "Failed to fetch applications" },
      { status: 500 }
    )
  }
}

// POST - Create a new application
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only ADMIN and COUNSELOR can create applications
    if (session.user.role !== 'ADMIN' && session.user.role !== 'COUNSELOR') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = createApplicationSchema.parse(body)

    // Check if student exists and belongs to the consultancy
    const student = await prisma.student.findFirst({
      where: {
        id: validatedData.studentId,
        consultancyId: session.user.consultancyId
      }
    })

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    // Check if school exists and belongs to the consultancy
    const school = await prisma.school.findFirst({
      where: {
        id: validatedData.schoolId,
        consultancyId: session.user.consultancyId
      }
    })

    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 })
    }

    // Check if application already exists
    const existingApplication = await prisma.application.findUnique({
      where: {
        studentId_schoolId: {
          studentId: validatedData.studentId,
          schoolId: validatedData.schoolId
        }
      }
    })

    if (existingApplication) {
      return NextResponse.json(
        { error: "Application already exists for this student and school" },
        { status: 409 }
      )
    }

    const application = await prisma.application.create({
      data: {
        studentId: validatedData.studentId,
        schoolId: validatedData.schoolId,
        notes: validatedData.notes,
        submittedBy: session.user.id,
        submittedAt: new Date(),
        status: 'SUBMITTED'
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            passportNumber: true,
            visaStatus: true
          }
        },
        school: {
          select: {
            id: true,
            name: true,
            isPartner: true
          }
        }
      }
    })

    return NextResponse.json(application, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      )
    }

    console.error("Error creating application:", error)
    return NextResponse.json(
      { error: "Failed to create application" },
      { status: 500 }
    )
  }
}
