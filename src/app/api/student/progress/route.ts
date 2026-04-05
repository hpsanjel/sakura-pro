import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createYearFilterForField } from "@/lib/year-filter"

// GET - Fetch student's own progress
export async function GET(request: NextRequest) {
  try {
    console.log('=== STUDENT PROGRESS GET START ===')
    const session = await getServerSession(authOptions)
    console.log('Session:', session?.user?.id, session?.user?.role)
    
    if (!session) {
      console.log('ERROR: No session')
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only STUDENT can view their own progress
    if (session.user.role !== 'STUDENT') {
      console.log('ERROR: Not a student, role:', session.user.role)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get student record
    console.log('Looking up student for userId:', session.user.id)
    const student = await prisma.student.findUnique({
      where: { userId: session.user.id },
    })

    if (!student) {
      console.log('ERROR: Student profile not found for userId:', session.user.id)
      return NextResponse.json({ error: "Student profile not found" }, { status: 404 })
    }

    console.log('Found student with ID:', student.id)

    // Get consultancy's selected year
    const consultancy = await prisma.consultancy.findUnique({
      where: { id: session.user.consultancyId },
      select: { selectedYear: true }
    })

    if (!consultancy) {
      console.log('ERROR: Consultancy not found')
      return NextResponse.json({ error: "Consultancy not found" }, { status: 404 })
    }

    console.log('Consultancy selected year:', consultancy.selectedYear)

    // Create year filter based on consultancy selected year
    const yearFilter = createYearFilterForField(consultancy.selectedYear, 'enrolledAt')
    console.log('Year filter:', yearFilter)

    // Fetch student's enrollments with progress
    const studentData = await prisma.student.findUnique({
      where: { id: student.id },
      select: {
        id: true,
        name: true,
        passportNumber: true,
        japaneseLanguageLevel: true,
        enrollments: {
          where: {
            isActive: true,
            ...yearFilter, // Apply year filter to enrolledAt
          },
          select: {
            id: true,
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
        },
      },
    })

    if (!studentData) {
      console.log('ERROR: Student data not found')
      return NextResponse.json({ error: "Student data not found" }, { status: 404 })
    }

    console.log('Found student enrollments:', studentData.enrollments.length)
    console.log('Total progress records:', studentData.enrollments.reduce((sum, e) => sum + e.progress.length, 0))
    console.log('=== STUDENT PROGRESS GET END ===')

    return NextResponse.json(studentData)
  } catch (error) {
    console.error("=== STUDENT PROGRESS GET ERROR ===")
    console.error("Error fetching student progress:", error)
    return NextResponse.json(
      { error: "Failed to fetch student progress" },
      { status: 500 }
    )
  }
}
