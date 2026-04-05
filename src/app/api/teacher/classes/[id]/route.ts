import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/teacher/classes/[id] - Fetch specific class details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('=== GET TEACHER CLASS DETAILS START ===')
    const session = await getServerSession(authOptions)
    console.log('Session:', session?.user?.id, session?.user?.role)
    
    if (!session) {
      console.log('ERROR: No session')
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only TEACHER can view their class details
    if (session.user.role !== 'TEACHER') {
      console.log('ERROR: Not a teacher, role:', session.user.role)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    console.log('Class ID:', id)

    // Get teacher record
    console.log('Looking up teacher for userId:', session.user.id)
    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
    })

    if (!teacher) {
      console.log('ERROR: Teacher profile not found for userId:', session.user.id)
      return NextResponse.json({ error: "Teacher profile not found" }, { status: 404 })
    }

    console.log('Found teacher with ID:', teacher.id)

    // Fetch the specific class with all details
    const classDetails = await prisma.japaneseClass.findFirst({
      where: {
        id,
        teacherId: teacher.id,
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
                email: true,
              },
            },
          },
          orderBy: { enrolledAt: 'desc' },
        },
        _count: {
          select: {
            enrollments: {
              where: { isActive: true },
            },
          },
        },
      },
    })

    if (!classDetails) {
      console.log('ERROR: Class not found or access denied')
      return NextResponse.json({ error: "Class not found" }, { status: 404 })
    }

    console.log('Found class:', classDetails.name)
    console.log('=== GET TEACHER CLASS DETAILS SUCCESS ===')

    return NextResponse.json(classDetails)
  } catch (error) {
    console.error("=== GET TEACHER CLASS DETAILS ERROR ===")
    console.error("Error fetching class details:", error)
    return NextResponse.json(
      { error: "Failed to fetch class details" },
      { status: 500 }
    )
  }
}
