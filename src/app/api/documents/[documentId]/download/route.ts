import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { documentId } = await params

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the document from database
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        student: {
          include: {
            consultancy: true
          }
        }
      }
    })

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    // Check permissions
    const userRole = session.user.role
    const userConsultancyId = session.user.consultancyId

    // Students can only download their own documents
    if (userRole === "STUDENT") {
      const student = await prisma.student.findFirst({
        where: { userId: session.user.id }
      })
      
      if (!student || student.id !== document.studentId) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 })
      }
    }
    // Admin/Counselor can download documents from their consultancy
    else if (["ADMIN", "COUNSELOR"].includes(userRole)) {
      if (document.student.consultancyId !== userConsultancyId) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 })
      }
    }
    // Superadmin can download any document
    else if (userRole !== "SUPERADMIN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // If the document is stored in Cloudinary, redirect to the Cloudinary URL
    if (document.filePath && document.filePath.startsWith('https://res.cloudinary.com')) {
      // For Cloudinary files, we can redirect to the URL
      // This allows the browser to download directly from Cloudinary
      return NextResponse.redirect(document.filePath)
    }

    // For local files (fallback), you would implement file reading here
    // But since we're using Cloudinary, this path shouldn't be reached
    return NextResponse.json({ error: "File not found" }, { status: 404 })

  } catch (error) {
    console.error("Error downloading document:", error)
    return NextResponse.json(
      { error: "Failed to download document" },
      { status: 500 }
    )
  }
}
