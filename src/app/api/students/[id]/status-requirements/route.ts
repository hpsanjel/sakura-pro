import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getStudentStatusRequirements } from "@/lib/status-helpers"

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

    // Only ADMIN and COUNSELOR can view student status requirements
    if (session.user.role !== 'ADMIN' && session.user.role !== 'COUNSELOR') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const student = await prisma.student.findFirst({
      where: {
        id: id,
        consultancyId: session.user.consultancyId
      }
    })

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    const requirements = await getStudentStatusRequirements(id, student.visaStatus)

    return NextResponse.json(requirements)
  } catch (error) {
    console.error("Error fetching student status requirements:", error)
    return NextResponse.json(
      { error: "Failed to fetch status requirements" },
      { status: 500 }
    )
  }
}
