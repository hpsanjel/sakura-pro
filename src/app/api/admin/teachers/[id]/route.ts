import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateTeacherSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address").optional(),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
  specialization: z.string().optional(),
  experience: z.string().optional(),
  qualifications: z.string().optional(),
  employmentType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "FREELANCE"]).optional(),
  salary: z.number().min(0).optional(),
  currency: z.string().optional(),
  status: z.enum(["APPLICANT", "SCREENING", "INTERVIEW", "OFFERED", "HIRED", "PROBATION", "ACTIVE", "ON_LEAVE", "TERMINATED"]).optional(),
})

// PUT - Update a teacher
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 })
    }

    const { id: teacherId } = await params

    // Verify teacher exists and belongs to the same consultancy
    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
      include: {
        user: true,
      },
    })

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 })
    }

    if (teacher.consultancyId !== session.user.consultancyId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    
    const validation = updateTeacherSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.issues },
        { status: 400 }
      )
    }

    const updateData = validation.data

    // If email is being updated, check if it's already taken by another user
    if (updateData.email && updateData.email !== teacher.user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: updateData.email },
      })

      if (existingUser) {
        return NextResponse.json(
          { error: "Email already exists" },
          { status: 409 }
        )
      }

      // Update user email
      await prisma.user.update({
        where: { id: teacher.userId },
        data: { email: updateData.email },
      })
    }

    // Update teacher profile
    const updatedTeacher = await prisma.teacher.update({
      where: { id: teacherId },
      data: {
        firstName: updateData.firstName,
        lastName: updateData.lastName,
        phoneNumber: updateData.phoneNumber,
        address: updateData.address,
        specialization: updateData.specialization,
        experience: updateData.experience,
        qualifications: updateData.qualifications,
        employmentType: updateData.employmentType,
        salary: updateData.salary,
        currency: updateData.currency,
        status: updateData.status,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    })

    // Transform the data to match the frontend interface
    const transformedTeacher = {
      id: updatedTeacher.id,
      userId: updatedTeacher.userId,
      firstName: updatedTeacher.firstName,
      lastName: updatedTeacher.lastName,
      email: updatedTeacher.user.email,
      phoneNumber: updatedTeacher.phoneNumber,
      address: updatedTeacher.address,
      specialization: updatedTeacher.specialization,
      experience: updatedTeacher.experience,
      qualifications: updatedTeacher.qualifications,
      status: updatedTeacher.status,
      employmentType: updatedTeacher.employmentType,
      salary: updatedTeacher.salary,
      currency: updatedTeacher.currency,
      hireDate: updatedTeacher.hireDate?.toISOString(),
      employeeId: updatedTeacher.employeeId,
      createdAt: updatedTeacher.createdAt.toISOString(),
      user: updatedTeacher.user,
      _count: {
        documents: 0,
        payslips: 0,
      },
    }

    return NextResponse.json(transformedTeacher)
  } catch (error) {
    console.error("Error updating teacher:", error)
    return NextResponse.json(
      { error: "Failed to update teacher" },
      { status: 500 }
    )
  }
}

// DELETE - Delete a teacher
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 })
    }

    const { id: teacherId } = await params

    // Verify teacher exists and belongs to the same consultancy
    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
    })

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 })
    }

    if (teacher.consultancyId !== session.user.consultancyId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Delete the teacher (this will cascade delete the user due to the relation)
    await prisma.teacher.delete({
      where: { id: teacherId },
    })

    return NextResponse.json({ message: "Teacher deleted successfully" })
  } catch (error) {
    console.error("Error deleting teacher:", error)
    return NextResponse.json(
      { error: "Failed to delete teacher" },
      { status: 500 }
    )
  }
}
