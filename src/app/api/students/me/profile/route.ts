import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Forbidden - Students only" }, { status: 403 })
    }

    // Find student record linked to this user
    const student = await prisma.student.findFirst({
      where: {
        userId: session.user.id
      }
    })

    if (!student) {
      return NextResponse.json({ error: "Student record not found" }, { status: 404 })
    }

    const body = await request.json()
    const {
      name,
      dateOfBirth,
      phone,
      address,
      education,
      japaneseLanguageLevel,
      intake,
      passportNumber,
      studyGoals,
      preferredStudyField,
      workExperience
    } = body

    // Update student profile
    const updatedStudent = await prisma.student.update({
      where: {
        id: student.id
      },
      data: {
        name: name || student.name,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : student.dateOfBirth,
        phone: phone || student.phone,
        address: address || student.address,
        education: education || student.education,
        japaneseLanguageLevel: japaneseLanguageLevel || student.japaneseLanguageLevel,
        intake: intake || student.intake,
        passportNumber: passportNumber || student.passportNumber,
        studyGoals: studyGoals || student.studyGoals,
        preferredStudyField: preferredStudyField || student.preferredStudyField,
        workExperience: workExperience || student.workExperience,
        updatedAt: new Date()
      }
    })

    return NextResponse.json(updatedStudent)
  } catch (error) {
    console.error("Error updating student profile:", error)
    return NextResponse.json(
      { error: "Failed to update student profile" },
      { status: 500 }
    )
  }
}
