import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// DELETE - Unenroll student from a class
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; enrollmentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id, enrollmentId } = await params
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only ADMIN and COUNSELOR can unenroll students
    if (session.user.role !== 'ADMIN' && session.user.role !== 'COUNSELOR') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Check if student exists and belongs to the user's consultancy
    const student = await prisma.student.findFirst({
      where: {
        id: id,
        consultancyId: session.user.consultancyId
      }
    })

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    // Find the enrollment
    const enrollment = await prisma.classEnrollment.findFirst({
      where: {
        id: enrollmentId,
        studentId: id,
        isActive: true,
      },
      include: {
        class: {
          select: {
            id: true,
            consultancyId: true,
          },
        },
      },
    })

    if (!enrollment) {
      return NextResponse.json({ error: "Enrollment not found" }, { status: 404 })
    }

    // Verify the class belongs to the same consultancy
    if (enrollment.class.consultancyId !== session.user.consultancyId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Soft delete by setting isActive to false and recording drop date
    const updatedEnrollment = await prisma.classEnrollment.update({
      where: {
        id: enrollmentId,
      },
      data: {
        isActive: false,
        droppedAt: new Date(),
      },
    })

    return NextResponse.json({ message: "Student unenrolled successfully" })
  } catch (error) {
    console.error("Error unenrolling student:", error)
    return NextResponse.json(
      { error: "Failed to unenroll student" },
      { status: 500 }
    )
  }
}
