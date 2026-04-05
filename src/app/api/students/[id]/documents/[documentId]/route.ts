import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { readFile } from "fs/promises"
import { existsSync } from "fs"
import { deleteFile } from "@/lib/file-upload"
import { deleteFromCloudinary, extractPublicIdFromUrl, cloudinaryConfigured } from "@/lib/cloudinary"

// Validation schema for updating document status
const updateDocumentSchema = z.object({
  status: z.enum(["UPLOADED", "VERIFIED", "REJECTED"]),
  notes: z.string().nullable().optional(),
})

// GET - Download a document
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, documentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id, documentId } = await params
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only ADMIN and COUNSELOR can download documents
    if (session.user.role !== 'ADMIN' && session.user.role !== 'COUNSELOR') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Verify student belongs to the user's consultancy
    const student = await prisma.student.findFirst({
      where: {
        id: id,
        consultancyId: session.user.consultancyId
      }
    })

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    // Get document
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        studentId: id
      }
    })

    if (!document || !document.filePath) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    // Check if it's a Cloudinary URL or local file
    if (document.filePath.startsWith('https://')) {
      // Cloudinary file - redirect to the URL
      return NextResponse.redirect(document.filePath)
    } else {
      // Local file
      if (!existsSync(document.filePath)) {
        return NextResponse.json({ error: "File not found" }, { status: 404 })
      }

      // Read file
      const fileBuffer = await readFile(document.filePath)
      const fileName = document.fileName || "document"
      
      // Determine content type
      const fileExtension = fileName.toLowerCase().split('.').pop()
      let contentType = "application/octet-stream"
      
      if (fileExtension === 'jpg' || fileExtension === 'jpeg') {
        contentType = "image/jpeg"
      } else if (fileExtension === 'pdf') {
        contentType = "application/pdf"
      }

      // Check if this is a preview request (no download parameter)
      const url = new URL(request.url)
      const isDownload = url.searchParams.get('download') === 'true'

      // Return file
      return new NextResponse(fileBuffer, {
        headers: {
          "Content-Type": contentType,
          "Content-Disposition": isDownload 
            ? `attachment; filename="${fileName}"`
            : `inline; filename="${fileName}"`,
        },
      })
    }
  } catch (error) {
    console.error("Error downloading document:", error)
    return NextResponse.json(
      { error: "Failed to download document" },
      { status: 500 }
    )
  }
}

// PUT - Update document status and notes
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, documentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id, documentId } = await params
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only ADMIN and COUNSELOR can update documents
    if (session.user.role !== 'ADMIN' && session.user.role !== 'COUNSELOR') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Verify student belongs to the user's consultancy
    const student = await prisma.student.findFirst({
      where: {
        id: id,
        consultancyId: session.user.consultancyId
      }
    })

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    const body = await request.json()
    const validatedData = updateDocumentSchema.parse(body)

    // Get document
    const existingDocument = await prisma.document.findFirst({
      where: {
        id: documentId,
        studentId: id
      }
    })

    if (!existingDocument) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    // Update document
    const updateData: any = {
      status: validatedData.status,
      updatedAt: new Date()
    }

    // Handle notes field - only set if it's not null
    if (validatedData.notes !== null && validatedData.notes !== undefined) {
      updateData.notes = validatedData.notes
    }

    if (validatedData.status === "VERIFIED") {
      updateData.verifiedAt = new Date()
    }

    if (validatedData.status === "REJECTED") {
      updateData.rejectedAt = new Date()
    }

    if (validatedData.status === "UPLOADED") {
      // Clear all previous status information when resetting to UPLOADED
      Object.assign(updateData, {
        verifiedAt: null,
        rejectedAt: null,
        notes: null
      })
    }

    console.log("Updating document with data:", updateData)
    
    const document = await prisma.document.update({
      where: { id: documentId },
      data: updateData
    })

    return NextResponse.json(document)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      )
    }

    console.error("Error updating document:", error)
    console.error("Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json(
      { error: "Failed to update document", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

// DELETE - Delete a document
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, documentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id, documentId } = await params
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only ADMIN can delete documents
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Verify student belongs to the user's consultancy
    const student = await prisma.student.findFirst({
      where: {
        id: id,
        consultancyId: session.user.consultancyId
      }
    })

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    // Get document
    const existingDocument = await prisma.document.findFirst({
      where: {
        id: documentId,
        studentId: id
      }
    })

    if (!existingDocument) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    // Delete file from storage if it exists
    if (existingDocument.filePath) {
      if (cloudinaryConfigured) {
        // Try Cloudinary deletion first
        const publicId = extractPublicIdFromUrl(existingDocument.filePath)
        if (publicId) {
          try {
            await deleteFromCloudinary(publicId)
          } catch (error) {
            console.error("Failed to delete from Cloudinary:", error)
            // Continue with database deletion even if Cloudinary deletion fails
          }
        } else {
          // Fallback to local file deletion for backward compatibility
          try {
            await deleteFile(existingDocument.filePath)
          } catch (error) {
            console.error("Failed to delete local file:", error)
          }
        }
      } else {
        // Use local storage if Cloudinary is not configured
        try {
          await deleteFile(existingDocument.filePath)
        } catch (error) {
          console.error("Failed to delete local file:", error)
        }
      }
    }

    // Delete document from database
    await prisma.document.delete({
      where: { id: documentId }
    })

    return NextResponse.json({ message: "Document deleted successfully" })
  } catch (error) {
    console.error("Error deleting document:", error)
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 }
    )
  }
}
