import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Validation schemas
const updateYearSchema = z.object({
  selectedYear: z.number().min(2020).max(2030)
})

const getYearStatsSchema = z.object({
  year: z.number().min(2020).max(2030).optional()
})

// GET - Get year management data
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only ADMIN can manage years
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const year = searchParams.get('year')
    
    // Get consultancy info
    const consultancy = await prisma.consultancy.findUnique({
      where: { id: session.user.consultancyId },
      select: {
        id: true,
        name: true,
        selectedYear: true,
        createdAt: true
      }
    })

    if (!consultancy) {
      return NextResponse.json({ error: "Consultancy not found" }, { status: 404 })
    }

    // If specific year requested, get year statistics
    if (year) {
      const yearNum = parseInt(year)
      const yearFilter = {
        createdAt: {
          gte: new Date(`${yearNum}-01-01`),
          lt: new Date(`${yearNum + 1}-01-01`)
        }
      }

      // Get statistics for the requested year
      const [
        studentCount,
        applicationCount,
        documentCount,
        enrollmentCount,
        interviewCount
      ] = await Promise.all([
        prisma.student.count({
          where: {
            consultancyId: consultancy.id,
            ...yearFilter
          }
        }),
        prisma.application.count({
          where: {
            student: {
              consultancyId: consultancy.id
            },
            ...yearFilter
          }
        }),
        prisma.document.count({
          where: {
            student: {
              consultancyId: consultancy.id
            },
            ...yearFilter
          }
        }),
        prisma.classEnrollment.count({
          where: {
            class: {
              consultancyId: consultancy.id
            },
            ...yearFilter
          }
        }),
        prisma.interview.count({
          where: {
            student: {
              consultancyId: consultancy.id
            },
            ...yearFilter
          }
        })
      ])

      return NextResponse.json({
        consultancy,
        yearStats: {
          year: yearNum,
          students: studentCount,
          applications: applicationCount,
          documents: documentCount,
          enrollments: enrollmentCount,
          interviews: interviewCount
        }
      })
    }

    // Get available years (years with data)
    const availableYears = await prisma.student.groupBy({
      by: ['createdAt'],
      where: {
        consultancyId: consultancy.id
      },
      _count: true
    })

    const yearsWithData = availableYears
      .map(item => item.createdAt.getFullYear())
      .filter((year, index, arr) => arr.indexOf(year) === index) // Unique years
      .sort((a, b) => b - a) // Most recent first

    return NextResponse.json({
      consultancy,
      availableYears: yearsWithData,
      currentYear: new Date().getFullYear()
    })

  } catch (error) {
    console.error("Error fetching year management data:", error)
    return NextResponse.json(
      { error: "Failed to fetch year management data" },
      { status: 500 }
    )
  }
}

// PUT - Update consultancy active year
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only ADMIN can update years
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = updateYearSchema.parse(body)

    // Update consultancy active year
    const updatedConsultancy = await prisma.consultancy.update({
      where: { id: session.user.consultancyId },
      data: {
        selectedYear: validatedData.selectedYear
      },
      select: {
        id: true,
        name: true,
        selectedYear: true
      }
    })

    // Update all users in consultancy to use the new year (remove individual overrides)
    await prisma.user.updateMany({
      where: {
        consultancyId: session.user.consultancyId
      },
      data: {
        selectedYear: validatedData.selectedYear
      }
    })

    return NextResponse.json({
      consultancy: updatedConsultancy,
      message: `Active year updated to ${validatedData.selectedYear} for all users in consultancy`
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      )
    }

    console.error("Error updating active year:", error)
    return NextResponse.json(
      { error: "Failed to update active year" },
      { status: 500 }
    )
  }
}
