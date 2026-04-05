import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Validation schema for creating a class
const createClassSchema = z.object({
  name: z.string().min(1, "Class name is required"),
  level: z.enum(["N5", "N4", "N3", "N2", "N1"]),
  description: z.string().optional(),
  maxStudents: z.number().min(1).max(50).default(20),
  schedules: z.array(z.object({
    dayOfWeek: z.number().min(0).max(6), // 0=Sunday to 6=Saturday
    startTime: z.string(), // HH:MM format
    endTime: z.string(),   // HH:MM format
    room: z.string().optional(),
  })).optional(),
})

// GET - Fetch teacher's classes
export async function GET(request: NextRequest) {
  try {
    console.log('=== TEACHER GET CLASSES START ===')
    const session = await getServerSession(authOptions)
    console.log('Session:', session?.user?.id, session?.user?.role)
    
    if (!session) {
      console.log('ERROR: No session')
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only TEACHER can view their classes
    if (session.user.role !== 'TEACHER') {
      console.log('ERROR: Not a teacher, role:', session.user.role)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get teacher record to get the correct teacherId
    console.log('Looking up teacher for userId:', session.user.id)
    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
    })

    if (!teacher) {
      console.log('ERROR: Teacher profile not found for userId:', session.user.id)
      return NextResponse.json({ error: "Teacher profile not found" }, { status: 404 })
    }

    console.log('Found teacher with ID:', teacher.id)
    console.log('Fetching classes for teacherId:', teacher.id)

    const classes = await prisma.japaneseClass.findMany({
      where: {
        teacherId: teacher.id, // Use teacher.id instead of session.user.id
        consultancyId: session.user.consultancyId,
      },
      include: {
        schedules: {
          where: { isActive: true },
          orderBy: { dayOfWeek: 'asc' },
        },
        enrollments: {
          where: { isActive: true },
          include: {
            student: {
              select: {
                id: true,
                name: true,
                passportNumber: true,
              },
            },
          },
        },
        _count: {
          select: {
            enrollments: {
              where: { isActive: true },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    console.log('Found classes:', classes.length)
    console.log('=== TEACHER GET CLASSES END ===')

    return NextResponse.json(classes)
  } catch (error) {
    console.error("=== TEACHER GET CLASSES ERROR ===")
    console.error("Error fetching classes:", error)
    return NextResponse.json(
      { error: "Failed to fetch classes" },
      { status: 500 }
    )
  }
}

// POST - Create a new class
export async function POST(request: NextRequest) {
  try {
    console.log('=== TEACHER CREATE CLASS START ===')
    const session = await getServerSession(authOptions)
    console.log('Session:', session?.user?.id, session?.user?.role)
    
    if (!session) {
      console.log('ERROR: No session')
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only TEACHER can create classes
    if (session.user.role !== 'TEACHER') {
      console.log('ERROR: Not a teacher, role:', session.user.role)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    console.log('Request body:', body)
    const validatedData = createClassSchema.parse(body)
    console.log('Validated data:', validatedData)

    // Get teacher record
    console.log('Looking up teacher for userId:', session.user.id)
    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
    })

    console.log('Teacher found:', teacher ? 'YES' : 'NO')
    if (!teacher) {
      console.log('ERROR: Teacher profile not found for userId:', session.user.id)
      return NextResponse.json({ error: "Teacher profile not found" }, { status: 404 })
    }

    console.log('Creating class with teacherId:', teacher.id)
    const newClass = await prisma.japaneseClass.create({
      data: {
        name: validatedData.name,
        level: validatedData.level,
        description: validatedData.description,
        maxStudents: validatedData.maxStudents,
        consultancyId: session.user.consultancyId,
        teacherId: teacher.id,
        schedules: validatedData.schedules ? {
          create: validatedData.schedules.map(schedule => ({
            dayOfWeek: schedule.dayOfWeek,
            startTime: new Date(`2000-01-01T${schedule.startTime}:00`),
            endTime: new Date(`2000-01-01T${schedule.endTime}:00`),
            room: schedule.room,
          })),
        } : undefined,
      },
      include: {
        schedules: true,
        enrollments: true,
      },
    })

    console.log('Class created successfully:', newClass.id)
    console.log('=== TEACHER CREATE CLASS SUCCESS ===')

    return NextResponse.json(newClass, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.log('Validation error:', error.issues)
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      )
    }

    console.error("=== TEACHER CREATE CLASS ERROR ===")
    console.error("Error creating class:", error)
    return NextResponse.json(
      { error: "Failed to create class" },
      { status: 500 }
    )
  }
}
