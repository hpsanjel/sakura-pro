import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { uploadTeacherDocument } from "@/lib/cloudinary"

const employeeDocumentTypeEnum = [
  "CV", "Cover Letter", "Certificate", "Degree", "Transcript", 
  "Passport", "Visa", "Contract", "Police Clearance", "Health Cert", 
  "Photo ID", "Other"
] as const

// GET - Fetch all documents for an employee
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

    const { id: employeeId } = await params

    // Verify employee exists and belongs to the same consultancy
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        user: true,
        consultancy: true,
      },
    })

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 })
    }

    if (employee.consultancyId !== session.user.consultancyId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // For now, store documents in memory (in production, use a database table)
    // This is a temporary solution to demonstrate the functionality
    const storedDocuments = (global as any).employeeDocuments || {}
    const employeeDocuments = storedDocuments[employeeId] || []
    
    return NextResponse.json(employeeDocuments)
  } catch (error) {
    console.error("Error fetching employee documents:", error)
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

    const { id: employeeId } = await params

    // Verify employee exists and belongs to the same consultancy
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        user: true,
        consultancy: true,
      },
    })

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 })
    }

    if (employee.consultancyId !== session.user.consultancyId) {
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

    if (!employeeDocumentTypeEnum.includes(type as any)) {
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
      const employeeName = `${employee.firstName} ${employee.lastName}`
      const consultancyName = employee.consultancy.name
      const uploadResult = await uploadTeacherDocument(file, consultancyName, employeeName, type)

      // Store document in memory (in production, save to database)
      const storedDocuments = (global as any).employeeDocuments || {}
      if (!storedDocuments[employeeId]) {
        storedDocuments[employeeId] = []
      }
      
      const newDocument = {
        id: Math.random().toString(36).substr(2, 9),
        employeeId: employeeId,
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
      
      storedDocuments[employeeId].push(newDocument)
      ;(global as any).employeeDocuments = storedDocuments

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
