import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { uploadTeacherDocument } from "@/lib/cloudinary"

const teacherDocumentTypeEnum = [
  "CV", "Cover Letter", "Certificate", "Degree", "Transcript", 
  "Passport", "Visa", "Contract", "Police Clearance", "Health Cert", 
  "Photo ID", "Other"
] as const

// GET - Fetch all documents for a teacher
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 })
    }

    const { id: teacherId } = await params

    // Verify teacher exists and belongs to the same consultancy
    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
      include: {
        user: true,
        consultancy: true,
      },
    })

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 })
    }

    if (teacher.consultancyId !== session.user.consultancyId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // For now, store documents in memory (in production, use a database table)
    // This is a temporary solution to demonstrate the functionality
    const storedDocuments = (global as any).teacherDocuments || {}
    const teacherDocuments = storedDocuments[teacherId] || []
    
    return NextResponse.json(teacherDocuments)
  } catch (error) {
    console.error("Error fetching teacher documents:", error)
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    )
  }
}

// POST - Upload a new document
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 })
    }

    const { id: teacherId } = await params

    // Verify teacher exists and belongs to the same consultancy
    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
      include: {
        user: true,
        consultancy: true,
      },
    })

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 })
    }

    if (teacher.consultancyId !== session.user.consultancyId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const type = formData.get("type") as string
    const title = formData.get("title") as string
    const notes = formData.get("notes") as string

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!teacherDocumentTypeEnum.includes(type as any)) {
      return NextResponse.json({ error: "Invalid document type" }, { status: 400 })
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File size must be less than 10MB" }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/jpg'
    ]
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type. Only PDF, Word, and image files are allowed." }, { status: 400 })
    }

    try {
      // Upload to Cloudinary with proper folder structure
      const teacherName = `${teacher.firstName} ${teacher.lastName}`
      const consultancyName = teacher.consultancy.name
      const uploadResult = await uploadTeacherDocument(file, consultancyName, teacherName, type)

      // Store document in memory (in production, save to database)
      const storedDocuments = (global as any).teacherDocuments || {}
      if (!storedDocuments[teacherId]) {
        storedDocuments[teacherId] = []
      }
      
      const newDocument = {
        id: Math.random().toString(36).substr(2, 9),
        teacherId: teacherId,
        type,
        title: title || type,
        fileName: file.name,
        filePath: uploadResult.secure_url,
        fileSize: uploadResult.bytes,
        mimeType: file.type,
        status: "UPLOADED",
        uploadedAt: new Date().toISOString(),
        uploadedBy: session.user.id,
        cloudinaryPublicId: uploadResult.public_id,
        notes,
      }
      
      storedDocuments[teacherId].push(newDocument)
      ;(global as any).teacherDocuments = storedDocuments

      return NextResponse.json(newDocument, { status: 201 })
    } catch (uploadError) {
      console.error("Error uploading to Cloudinary:", uploadError)
      return NextResponse.json(
        { error: "Failed to upload document to cloud storage" },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Error uploading document:", error)
    return NextResponse.json(
      { error: "Failed to upload document" },
      { status: 500 }
    )
  }
}
