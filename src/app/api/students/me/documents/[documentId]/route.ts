import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { readFile } from "fs/promises"

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

    if (session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Forbidden - Students only" }, { status: 403 })
    }

    // Find student record for this user
    const student = await prisma.student.findFirst({
      where: {
        userId: session.user.id
      }
    })

    if (!student) {
      return NextResponse.json({ error: "Student record not found" }, { status: 404 })
    }

    // Get the specific document
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        studentId: student.id
      }
    })

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    // Check if download query parameter is present
    const { searchParams } = new URL(request.url)
    const isDownload = searchParams.get("download") === "true"

    if (isDownload) {
      // For download, return the file
      if (!document.filePath || !document.fileName) {
        return NextResponse.json({ error: "File not found" }, { status: 404 })
      }

      try {
        const fileBuffer = await readFile(document.filePath)
        const mimeType = document.fileName.toLowerCase().endsWith('.pdf') 
          ? 'application/pdf' 
          : 'image/jpeg'

        return new NextResponse(fileBuffer, {
          headers: {
            'Content-Type': mimeType,
            'Content-Disposition': `attachment; filename="${document.fileName}"`
          }
        })
      } catch (fileError) {
        console.error("Error reading file:", fileError)
        return NextResponse.json(
          { error: "File not found on server" },
          { status: 404 }
        )
      }
    } else {
      // For view, return document metadata and serve file
      if (!document.filePath || !document.fileName) {
        return NextResponse.json({ error: "File not found" }, { status: 404 })
      }

      try {
        const fileBuffer = await readFile(document.filePath)
        const mimeType = document.fileName.toLowerCase().endsWith('.pdf') 
          ? 'application/pdf' 
          : 'image/jpeg'

        return new NextResponse(fileBuffer, {
          headers: {
            'Content-Type': mimeType
          }
        })
      } catch (fileError) {
        console.error("Error reading file:", fileError)
        return NextResponse.json(
          { error: "File not found on server" },
          { status: 404 }
        )
      }
    }
  } catch (error) {
    console.error("Error fetching document:", error)
    return NextResponse.json(
      { error: "Failed to fetch document" },
      { status: 500 }
    )
  }
}
