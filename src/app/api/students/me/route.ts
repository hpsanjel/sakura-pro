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

    // Find student record linked to this user
    const student = await prisma.student.findFirst({
      where: {
        userId: session.user.id
      },
      select: {
        id: true,
        name: true,
        passportNumber: true,
        phone: true,
        japaneseLanguageLevel: true,
        intake: true,
        visaStatus: true,
        category: true,
        email: true,
        createdAt: true,
        userId: true
      }
    })

    if (!student) {
      return NextResponse.json({ error: "Student record not found" }, { status: 404 })
    }

    return NextResponse.json(student)
  } catch (error) {
    console.error("Error fetching student data:", error)
    return NextResponse.json(
      { error: "Failed to fetch student data" },
      { status: 500 }
    )
  }
}
