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

    if (session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Forbidden - SuperAdmin access required" }, { status: 403 })
    }

    // Fetch all database tables
    const [consultancies, users, students, applications, documents, schools, sponsors] = await Promise.all([
      prisma.consultancy.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: {
              users: true,
              students: true,
              schools: true,
            },
          },
        },
      }),
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          consultancyId: true,
          createdAt: true,
          consultancy: {
            select: {
              name: true,
            },
          },
        },
      }),
      prisma.student.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          consultancy: {
            select: {
              name: true,
            },
          },
        },
      }),
      prisma.application.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          student: {
            select: {
              name: true,
              consultancyId: true,
            },
          },
          school: {
            select: {
              name: true,
            },
          },
        },
      }),
      prisma.document.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          student: {
            select: {
              name: true,
            },
          },
        },
      }),
      prisma.school.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          consultancy: {
            select: {
              name: true,
            },
          },
        },
      }),
      prisma.sponsor.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          student: {
            select: {
              name: true,
            },
          },
        },
      }),
    ])

    return NextResponse.json({
      consultancies,
      users,
      students,
      applications,
      documents,
      schools,
      sponsors,
    })
  } catch (error) {
    console.error("Error fetching database data:", error)
    return NextResponse.json(
      { error: "Failed to fetch database data" },
      { status: 500 }
    )
  }
}
