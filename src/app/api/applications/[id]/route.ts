import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Validation schema for updating an application
const updateApplicationSchema = z.object({
  status: z.enum(["PENDING", "SUBMITTED", "ACCEPTED", "REJECTED", "WAITLISTED", "WITHDRAWN"]).optional(),
  notes: z.string().optional(),
  responseNotes: z.string().nullable().optional(),
  responseDate: z.string().nullable().transform((str) => str ? new Date(str) : null).optional(),
  submittedAt: z.string().nullable().transform((str) => str ? new Date(str) : null).optional(),
})

// GET - Fetch a single application
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

    // Only ADMIN and COUNSELOR can view applications
    if (session.user.role !== 'ADMIN' && session.user.role !== 'COUNSELOR') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const application = await prisma.application.findFirst({
      where: {
        id: id,
        student: {
          consultancyId: session.user.consultancyId
        }
      },
      include: {
        student: true,
        school: true
      }
    })

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 })
    }

    return NextResponse.json(application)
  } catch (error) {
    console.error("Error fetching application:", error)
    return NextResponse.json(
      { error: "Failed to fetch application" },
      { status: 500 }
    )
  }
}

// PUT - Update an application
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only ADMIN and COUNSELOR can update applications
    if (session.user.role !== 'ADMIN' && session.user.role !== 'COUNSELOR') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    console.log("PUT application request body:", body)
    
    let validatedData
    try {
      validatedData = updateApplicationSchema.parse(body)
      console.log("Validated data:", validatedData)
    } catch (validationError) {
      console.error("Validation error:", validationError)
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          { 
            error: "Validation failed", 
            details: validationError.issues,
            received: body
          },
          { status: 400 }
        )
      }
      throw validationError
    }

    // Check if application exists and belongs to the consultancy
    const existingApplication = await prisma.application.findFirst({
      where: {
        id: id,
        student: {
          consultancyId: session.user.consultancyId
        }
      }
    })

    if (!existingApplication) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 })
    }

    const application = await prisma.application.update({
      where: { id: id },
      data: {
        ...validatedData,
        // Explicitly handle responseNotes to ensure it updates correctly
        responseNotes: validatedData.responseNotes,
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
            isPartner: true,
            website: true
          }
        }
      }
    })

    console.log("Updated application:", application)
    console.log("ResponseNotes field value:", application.responseNotes)

    return NextResponse.json(application)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      )
    }

    console.error("Error updating application:", error)
    return NextResponse.json(
      { error: "Failed to update application" },
      { status: 500 }
    )
  }
}

// DELETE - Delete an application
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only ADMIN can delete applications
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Check if application exists and belongs to the consultancy
    const existingApplication = await prisma.application.findFirst({
      where: {
        id: id,
        student: {
          consultancyId: session.user.consultancyId
        }
      }
    })

    if (!existingApplication) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 })
    }

    await prisma.application.delete({
      where: { id: id }
    })

    return NextResponse.json({ 
      message: "Application deleted successfully"
    })
  } catch (error) {
    console.error("Error deleting application:", error)
    return NextResponse.json(
      { error: "Failed to delete application" },
      { status: 500 }
    )
  }
}
