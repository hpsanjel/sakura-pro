import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getApiSession, requireRole, tenantWhere } from "@/lib/api-auth"

export async function GET(request: NextRequest) {
  try {
    const session = await getApiSession()

    // Only ADMIN, COUNSELOR, and SUPERADMIN can view all documents
    const denied = requireRole(session, ["ADMIN", "COUNSELOR", "SUPERADMIN"])
    if (denied) return denied

    // Get all students (scoped to the caller's consultancy) with their documents
    const students = await prisma.student.findMany({
      where: tenantWhere(session!),
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
