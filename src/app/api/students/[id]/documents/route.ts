import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { saveFile } from "@/lib/file-upload"
import { uploadToCloudinary, replaceInCloudinary, deleteFromCloudinary, extractPublicIdFromUrl, cloudinaryConfigured } from "@/lib/cloudinary"

// Required document types for Japan student visa
const REQUIRED_DOCUMENT_TYPES = [
  "Passport",
  "Academic Transcripts",
  "Bank Statement",
  "Sponsorship Documents",
  "Statement of Purpose (SOP)",
  "Birth Certificate",
  "Police Clearance Certificate",
  "Medical Certificate",
  "Photographs (Passport Size)",
  "Language Proficiency Certificate"
]

// Validation schema for creating a document
const createDocumentSchema = z.object({
  type: z.string().min(1, "Document type is required"),
  notes: z.string().optional(),
})

// GET - Fetch all documents for a student
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

    // Only ADMIN and COUNSELOR can view documents
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

    // Get existing documents
    const existingDocuments = await prisma.document.findMany({
      where: {
        studentId: id
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Ensure all required document types are present
    const documents = [...existingDocuments]
    const existingTypes = existingDocuments.map(doc => doc.type)

    // Add missing required document types
    for (const requiredType of REQUIRED_DOCUMENT_TYPES) {
      if (!existingTypes.includes(requiredType)) {
        documents.push({
          id: `missing-${requiredType.toLowerCase().replace(/\s+/g, '-')}`,
          type: requiredType,
          status: "MISSING",
          fileName: null,
          filePath: null,
          publicId: null,
          notes: null,
          uploadedAt: null,
          uploadedBy: null,
          verifiedAt: null,
          verifiedBy: null,
          rejectedAt: null,
          rejectedBy: null,
          rejectionReason: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          studentId: id
        })
      }
    }

    return NextResponse.json(documents)
  } catch (error) {
    console.error("Error fetching documents:", error)
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
    const { id } = await params
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only ADMIN, COUNSELOR, TEACHER, and SUPERADMIN can upload documents
    if (!['ADMIN', 'COUNSELOR', 'TEACHER', 'SUPERADMIN'].includes(session.user.role)) {
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

    const formData = await request.formData()
    const file = formData.get("file") as File
    const type = formData.get("type") as string
    const notes = formData.get("notes") as string

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      )
    }

    if (!type || !REQUIRED_DOCUMENT_TYPES.includes(type)) {
      return NextResponse.json(
        { error: "Invalid document type" },
        { status: 400 }
      )
    }

    // Validate file type (only JPEG, PNG and PDF allowed)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
    const fileExtension = file.name.toLowerCase().split('.').pop()
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'pdf']
    const maxSize = 10 * 1024 * 1024 // 10MB in bytes
    
    if (!allowedTypes.includes(file.type) || !allowedExtensions.includes(fileExtension || '')) {
      return NextResponse.json(
        { error: "Only JPEG, PNG and PDF files are allowed" },
        { status: 400 }
      )
    }

    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size must be less than 10MB" },
        { status: 400 }
      )
    }

    // Check if document of this type already exists
    const existingDocument = await prisma.document.findFirst({
      where: {
        studentId: id,
        type: type
      }
    })

    let document
    let filePath: string

    if (cloudinaryConfigured) {
      // Use Cloudinary if configured
      const folder = `documents/${session.user.consultancyId}/${id}`
      let cloudinaryResult

      if (existingDocument && existingDocument.filePath) {
        // Replace existing document in Cloudinary
        const oldPublicId = extractPublicIdFromUrl(existingDocument.filePath)
        if (oldPublicId) {
          cloudinaryResult = await replaceInCloudinary(oldPublicId, file, folder)
        } else {
          // Fallback to upload if we can't extract public_id
          cloudinaryResult = await uploadToCloudinary(file, folder)
        }
        filePath = cloudinaryResult.secure_url
      } else {
        // Upload new document to Cloudinary
        cloudinaryResult = await uploadToCloudinary(file, folder)
        filePath = cloudinaryResult.secure_url
      }
    } else {
      // Fallback to local storage
      const { fileName: savedFileName, filePath: savedFilePath } = await saveFile(
        file,
        session.user.consultancyId,
        id,
        type
      )
      filePath = savedFilePath
    }

    // Create or update document in database
    if (existingDocument) {
      // Update existing document
      document = await prisma.document.update({
        where: { id: existingDocument.id },
        data: {
          fileName: file.name,
          filePath: filePath,
          status: "UPLOADED",
          notes: notes || null,
          uploadedAt: new Date(),
          uploadedBy: session.user.name || session.user.email || "Unknown",
          updatedAt: new Date()
        }
      })
    } else {
      // Create new document
      document = await prisma.document.create({
        data: {
          studentId: id,
          type: type,
          fileName: file.name,
          filePath: filePath,
          status: "UPLOADED",
          notes: notes || null,
          uploadedAt: new Date(),
          uploadedBy: session.user.name || session.user.email || "Unknown"
        }
      })
    }

    return NextResponse.json(document, { status: 201 })
  } catch (error) {
    console.error("Error uploading document:", error)
    return NextResponse.json(
      { error: "Failed to upload document" },
      { status: 500 }
    )
  }
}
