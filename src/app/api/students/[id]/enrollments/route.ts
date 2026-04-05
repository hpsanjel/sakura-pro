import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Validation schema for creating enrollment
const createEnrollmentSchema = z.object({
  classId: z.string().min(1, "Class ID is required"),
  scheduleId: z.string().min(1, "Schedule ID is required"),
})

// GET - Fetch student's class enrollments
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only ADMIN, COUNSELOR, and TEACHER can view enrollments
    if (!["ADMIN", "COUNSELOR", "TEACHER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Check if student exists and belongs to the user's consultancy
    const student = await prisma.student.findFirst({
      where: {
        id: id,
        consultancyId: session.user.consultancyId
      }
    })

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    // For teachers, only show enrollments in their classes
    const whereClause: any = {
      studentId: id,
      isActive: true,
    }

    if (session.user.role === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({
        where: { userId: session.user.id },
      })

      if (!teacher) {
        return NextResponse.json({ error: "Teacher profile not found" }, { status: 404 })
      }

      whereClause.class = {
        teacherId: teacher.id,
      }
    }

    const enrollments = await prisma.classEnrollment.findMany({
      where: whereClause,
      include: {
        class: {
          select: {
            id: true,
            name: true,
            level: true,
            description: true,
            maxStudents: true,
            isActive: true,
          },
        },
        schedule: {
          select: {
            id: true,
            dayOfWeek: true,
            startTime: true,
            endTime: true,
            room: true,
          },
        },
      },
      orderBy: {
        enrolledAt: 'desc',
      },
    })

    return NextResponse.json(enrollments)
  } catch (error) {
    console.error("Error fetching enrollments:", error)
    return NextResponse.json(
      { error: "Failed to fetch enrollments" },
      { status: 500 }
    )
  }
}

// POST - Enroll student in a class
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only ADMIN and COUNSELOR can enroll students
    if (session.user.role !== 'ADMIN' && session.user.role !== 'COUNSELOR') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = createEnrollmentSchema.parse(body)

    // Check if student exists and belongs to the user's consultancy
    const student = await prisma.student.findFirst({
      where: {
        id: id,
        consultancyId: session.user.consultancyId
      }
    })

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    // Check if class exists and belongs to the consultancy
    const classItem = await prisma.japaneseClass.findFirst({
      where: {
        id: validatedData.classId,
        consultancyId: session.user.consultancyId,
        isActive: true,
      },
      include: {
        _count: {
          select: {
            enrollments: {
              where: { isActive: true },
            },
          },
        },
      },
    })

    if (!classItem) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 })
    }

    // Check if class is full
    if (classItem._count.enrollments >= classItem.maxStudents) {
      return NextResponse.json({ error: "Class is full" }, { status: 400 })
    }

    // Check if schedule exists and belongs to the class
    const schedule = await prisma.classSchedule.findFirst({
      where: {
        id: validatedData.scheduleId,
        classId: validatedData.classId,
        isActive: true,
      },
    })

    if (!schedule) {
      return NextResponse.json({ error: "Schedule not found" }, { status: 404 })
    }

    // Check for time conflicts with existing enrollments
    const existingEnrollments = await prisma.classEnrollment.findMany({
      where: {
        studentId: id,
        isActive: true,
      },
      include: {
        schedule: true,
      },
    })

    // Get the selected schedule details
    const selectedSchedule = await prisma.classSchedule.findUnique({
      where: { id: validatedData.scheduleId },
    })

    if (!selectedSchedule) {
      return NextResponse.json({ error: "Schedule not found" }, { status: 404 })
    }

    // Check for time conflicts
    const hasTimeConflict = existingEnrollments.some(enrollment => {
      const existingSchedule = enrollment.schedule
      // Check if same day and overlapping time
      if (existingSchedule.dayOfWeek !== selectedSchedule.dayOfWeek) {
        return false
      }

      // Convert times to minutes for comparison
      const existingStart = parseInt(String(existingSchedule.startTime).split(':')[0]) * 60 + parseInt(String(existingSchedule.startTime).split(':')[1])
      const existingEnd = parseInt(String(existingSchedule.endTime).split(':')[0]) * 60 + parseInt(String(existingSchedule.endTime).split(':')[1])
      const selectedStart = parseInt(String(selectedSchedule.startTime).split(':')[0]) * 60 + parseInt(String(selectedSchedule.startTime).split(':')[1])
      const selectedEnd = parseInt(String(selectedSchedule.endTime).split(':')[0]) * 60 + parseInt(String(selectedSchedule.endTime).split(':')[1])

      // Check if time ranges overlap
      return (existingStart < selectedEnd && selectedStart < existingEnd)
    })

    if (hasTimeConflict) {
      return NextResponse.json({ error: "Student is already enrolled in another class at this time" }, { status: 400 })
    }

    // Create enrollment
    const enrollment = await prisma.classEnrollment.create({
      data: {
        studentId: id,
        classId: validatedData.classId,
        scheduleId: validatedData.scheduleId,
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            level: true,
            description: true,
          },
        },
        schedule: {
          select: {
            id: true,
            dayOfWeek: true,
            startTime: true,
            endTime: true,
            room: true,
          },
        },
      },
    })

    return NextResponse.json(enrollment, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      )
    }

    // Handle Prisma unique constraint error
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { error: "Student is already enrolled in this class schedule" },
        { status: 400 }
      )
    }

    console.error("Error creating enrollment:", error)
    return NextResponse.json(
      { error: "Failed to create enrollment" },
      { status: 500 }
    )
  }
}
