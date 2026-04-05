import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Validation schema for sending student to Japan
const sendToJapanSchema = z.object({
  schoolIds: z.array(z.string()).min(1, "At least one school must be selected"),
  notes: z.string().optional(),
})

// POST - Send student application to Japan schools
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

    // Only ADMIN and COUNSELOR can send applications to Japan
    if (session.user.role !== 'ADMIN' && session.user.role !== 'COUNSELOR') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = sendToJapanSchema.parse(body)

    // Check if student exists and belongs to the consultancy
    const student = await prisma.student.findFirst({
      where: {
        id: id,
        consultancyId: session.user.consultancyId
      },
      include: {
        applications: true
      }
    })

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    // Check if student has DOCS_VERIFIED status
    if (student.visaStatus !== 'DOCS_VERIFIED') {
      return NextResponse.json(
        { error: "Student must have DOCS_VERIFIED status to send applications to Japan" },
        { status: 400 }
      )
    }

    // Verify all selected schools exist and are partner schools
    const schools = await prisma.school.findMany({
      where: {
        id: { in: validatedData.schoolIds },
        consultancyId: session.user.consultancyId,
        isPartner: true
      }
    })

    if (schools.length !== validatedData.schoolIds.length) {
      return NextResponse.json(
        { error: "Some selected schools are not valid partner schools" },
        { status: 400 }
      )
    }

    // Check for existing applications
    const existingApplications = await prisma.application.findMany({
      where: {
        studentId: id,
        schoolId: { in: validatedData.schoolIds }
      }
    })

    if (existingApplications.length > 0) {
      return NextResponse.json(
        { error: "Applications already exist for some selected schools" },
        { status: 409 }
      )
    }

    // Create applications for all selected schools
    const applications = await prisma.$transaction(async (tx) => {
      // Create applications
      const newApplications = await Promise.all(
        validatedData.schoolIds.map(schoolId =>
          tx.application.create({
            data: {
              studentId: id,
              schoolId: schoolId,
              status: 'SUBMITTED',
              notes: validatedData.notes,
              submittedAt: new Date()
            },
            include: {
              school: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          })
        )
      )

      // Update student status to SENT_TO_JAPAN
      await tx.student.update({
        where: { id: id },
        data: { visaStatus: 'SENT_TO_JAPAN' }
      })

      return newApplications
    })

    return NextResponse.json({
      message: `Successfully sent applications to ${applications.length} schools`,
      applications: applications,
      studentStatus: 'SENT_TO_JAPAN'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      )
    }

    console.error("Error sending applications to Japan:", error)
    return NextResponse.json(
      { error: "Failed to send applications to Japan" },
      { status: 500 }
    )
  }
}
