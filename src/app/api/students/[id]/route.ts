import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { deleteFromCloudinary, extractPublicIdFromUrl, cloudinaryConfigured } from "@/lib/cloudinary"
import { validateVisaStatusTransition } from "@/lib/visa-validation"

// Validation schema for updating a student
const updateStudentSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  passportNumber: z.string().min(1, "Passport number is required").optional(),
  dateOfBirth: z.string().transform((str) => new Date(str)).optional(),
  phone: z.string().min(1, "Phone is required").optional(),
  address: z.string().min(1, "Address is required").optional(),
  education: z.string().min(1, "Education is required").optional(),
  japaneseLanguageLevel: z.string().optional(),
  intake: z.enum(["April", "July", "October", "January"]).optional(),
  visaStatus: z.enum([
    "NEW_LEAD", "DOCS_PENDING", "DOCS_VERIFIED", "SENT_TO_JAPAN", 
    "COE_APPLIED", "COE_APPROVED", "VISA_APPLIED", "VISA_APPROVED", "REJECTED"
  ]).optional(),
  studyGoals: z.string().optional(),
  preferredStudyField: z.string().optional(),
  workExperience: z.string().optional(),
  financialProof: z.string().optional(),
})

// GET - Fetch a single student
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

    // Only ADMIN and COUNSELOR can view students
    if (session.user.role !== 'ADMIN' && session.user.role !== 'COUNSELOR') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const student = await prisma.student.findFirst({
      where: {
        id: id,
        consultancyId: session.user.consultancyId
      },
      include: {
        documents: true,
        sponsors: true,
        applications: {
          include: {
            school: true
          }
        }
      }
    })

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    return NextResponse.json(student)
  } catch (error) {
    console.error("Error fetching student:", error)
    return NextResponse.json(
      { error: "Failed to fetch student" },
      { status: 500 }
    )
  }
}

// PUT - Update a student
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

    // Only ADMIN and COUNSELOR can update students
    if (session.user.role !== 'ADMIN' && session.user.role !== 'COUNSELOR') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = updateStudentSchema.parse(body)

    // Check if student exists and belongs to the user's consultancy
    const existingStudent = await prisma.student.findFirst({
      where: {
        id: id,
        consultancyId: session.user.consultancyId
      }
    })

    if (!existingStudent) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    // If updating passport number, check for duplicates
    if (validatedData.passportNumber && validatedData.passportNumber !== existingStudent.passportNumber) {
      const duplicateStudent = await prisma.student.findFirst({
        where: {
          passportNumber: validatedData.passportNumber,
          consultancyId: session.user.consultancyId,
          id: { not: id }
        }
      })

      if (duplicateStudent) {
        return NextResponse.json(
          { error: "Passport number already exists" },
          { status: 409 }
        )
      }
    }

    // Validate visa status transition if it's being updated
    if (validatedData.visaStatus) {
      const validation = await validateVisaStatusTransition(
        id,
        validatedData.visaStatus,
        existingStudent.visaStatus
      )

      if (!validation.isValid) {
        return NextResponse.json(
          { 
            error: "Visa status transition not allowed", 
            details: validation.errors,
            warnings: validation.warnings
          },
          { status: 400 }
        )
      }

      // Log warnings if any
      if (validation.warnings.length > 0) {
        console.log(`Visa status update warnings for student ${id}:`, validation.warnings)
      }
    }

    const student = await prisma.student.update({
      where: { id: id },
      data: validatedData,
      include: {
        documents: true,
        sponsors: true,
        applications: {
          include: {
            school: true
          }
        }
      }
    })

    return NextResponse.json(student)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      )
    }

    console.error("Error updating student:", error)
    return NextResponse.json(
      { error: "Failed to update student" },
      { status: 500 }
    )
  }
}

// DELETE - Delete a student
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

    // Only ADMIN can delete students
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Check if student exists and belongs to the user's consultancy
    const existingStudent = await prisma.student.findFirst({
      where: {
        id: id,
        consultancyId: session.user.consultancyId
      }
    })

    if (!existingStudent) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    // First, get all documents to delete Cloudinary files
    const documents = await prisma.document.findMany({
      where: { studentId: id },
      select: { filePath: true }
    })

    // Delete files from Cloudinary if configured
    if (cloudinaryConfigured) {
      const deletionPromises = documents
        .filter(doc => doc.filePath) // Only documents with actual file paths
        .map(async (doc) => {
          try {
            const publicId = extractPublicIdFromUrl(doc.filePath!)
            if (publicId) {
              await deleteFromCloudinary(publicId)
              console.log(`Deleted Cloudinary file: ${publicId}`)
            }
          } catch (error) {
            console.error(`Failed to delete Cloudinary file for ${doc.filePath}:`, error)
            // Continue with student deletion even if file deletion fails
          }
        })

      await Promise.allSettled(deletionPromises)
    }

    // Now delete the student (this will cascade delete all related records)
    await prisma.student.delete({
      where: { id: id }
    })

    return NextResponse.json({ 
      message: "Student deleted successfully",
      deletedFiles: documents.filter(doc => doc.filePath).length
    })
  } catch (error) {
    console.error("Error deleting student:", error)
    return NextResponse.json(
      { error: "Failed to delete student" },
      { status: 500 }
    )
  }
}
