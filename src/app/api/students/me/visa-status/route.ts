import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Forbidden - Students only" }, { status: 403 })
    }

    // Find student record for this user
    let student = await prisma.student.findFirst({
      where: {
        userId: session.user.id
      }
    })

    // Fallback: Try finding by email if userId lookup fails
    if (!student && session.user.email) {
      student = await prisma.student.findFirst({
        where: {
          email: session.user.email
        }
      })
    }

    if (!student) {
      return NextResponse.json({ error: "Student record not found" }, { status: 404 })
    }

    return NextResponse.json({
      visaStatus: student.visaStatus,
      studentInfo: {
        name: student.name,
        passportNumber: student.passportNumber,
        intake: student.intake,
        japaneseLanguageLevel: student.japaneseLanguageLevel
      }
    })

  } catch (error) {
    console.error("Error fetching student visa status:", error)
    return NextResponse.json(
      { error: "Failed to fetch visa status" },
      { status: 500 }
    )
  }
}
