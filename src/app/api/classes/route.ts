import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Fetch available classes
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only ADMIN, COUNSELOR, and TEACHER can view classes
    if (!["ADMIN", "COUNSELOR", "TEACHER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const whereClause: any = {
      consultancyId: session.user.consultancyId,
      isActive: true,
    }

    // For teachers, only show their own classes
    if (session.user.role === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({
        where: { userId: session.user.id },
      })

      if (!teacher) {
        return NextResponse.json({ error: "Teacher profile not found" }, { status: 404 })
      }

      whereClause.teacherId = teacher.id
    }

    const classes = await prisma.japaneseClass.findMany({
      where: whereClause,
      include: {
        schedules: {
          where: { isActive: true },
          orderBy: { dayOfWeek: 'asc' },
        },
        teacher: {
          select: {
            id: true,
            user: {
              select: {
                id: true,
                name: true,
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

    return NextResponse.json(classes)
  } catch (error) {
    console.error("Error fetching classes:", error)
    return NextResponse.json(
      { error: "Failed to fetch classes" },
      { status: 500 }
    )
  }
}
