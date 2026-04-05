import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has permission to view all documents
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { consultancy: true }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Only ADMIN, COUNSELOR, and SUPERADMIN can view all documents
    if (!["ADMIN", "COUNSELOR", "SUPERADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    // Get all students with their documents
    const students = await prisma.student.findMany({
      include: {
        documents: {
          orderBy: {
            uploadedAt: "desc"
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    return NextResponse.json(students)
  } catch (error) {
    console.error("Error fetching students with documents:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
