import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Validation schema for creating an interview
const createInterviewSchema = z.object({
  studentId: z.string().min(1, "Student ID is required"),
  type: z.enum(["MOCK", "REAL", "EMBASSY"]),
  scheduledAt: z.string().transform((str) => new Date(str)),
  duration: z.number().min(15).max(180).optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
})

// GET - Fetch teacher's interviews
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only TEACHER can view their interviews
    if (session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')

    const whereClause: any = {
      teacherId: session.user.id,
    }

    if (status) {
      whereClause.status = status
    }

    if (type) {
      whereClause.type = type
    }

    const interviews = await prisma.interview.findMany({
      where: whereClause,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            passportNumber: true,
            japaneseLanguageLevel: true,
          },
        },
      },
      orderBy: {
        scheduledAt: 'asc',
      },
    })

    return NextResponse.json(interviews)
  } catch (error) {
    console.error("Error fetching interviews:", error)
    return NextResponse.json(
      { error: "Failed to fetch interviews" },
      { status: 500 }
    )
  }
}

// POST - Create a new interview
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only TEACHER can create interviews
    if (session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = createInterviewSchema.parse(body)

    // Get teacher record
    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
    })

    if (!teacher) {
      return NextResponse.json({ error: "Teacher profile not found" }, { status: 404 })
    }

    // Verify student belongs to same consultancy
    const student = await prisma.student.findUnique({
      where: { id: validatedData.studentId },
      select: { consultancyId: true },
    })

    if (!student || student.consultancyId !== session.user.consultancyId) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    const interview = await prisma.interview.create({
      data: {
        studentId: validatedData.studentId,
        teacherId: teacher.id,
        type: validatedData.type,
        scheduledAt: validatedData.scheduledAt,
        duration: validatedData.duration,
        location: validatedData.location,
        notes: validatedData.notes,
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
      },
    })

    return NextResponse.json(interview, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      )
    }

    console.error("Error creating interview:", error)
    return NextResponse.json(
      { error: "Failed to create interview" },
      { status: 500 }
    )
  }
}
