import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { uploadToCloudinary } from "@/lib/cloudinary"
import crypto from "crypto"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      console.log("No session found in API call")
      return NextResponse.json({ error: "Unauthorized - No session" }, { status: 401 })
    }

    if (session.user.role !== "STUDENT") {
      console.log("Non-student role trying to access student API:", session.user.role)
      return NextResponse.json({ error: "Forbidden - Students only" }, { status: 403 })
    }

    // Debug: Log session data
    console.log("Session data:", JSON.stringify(session, null, 2))
    console.log("User ID from session:", session.user.id)

    // Find student record linked to this user
    let student = await prisma.student.findFirst({
      where: {
        userId: session.user.id
      }
    })

    // Fallback: Try finding by email if userId lookup fails
    if (!student && session.user.email) {
      console.log("Trying fallback lookup by email:", session.user.email)
      student = await prisma.student.findFirst({
        where: {
          email: session.user.email
        }
      })
      
      if (student && !student.userId) {
        // Update student record with userId for future lookups
        await prisma.student.update({
          where: { id: student.id },
          data: { userId: session.user.id }
        })
        console.log("Updated student record with userId")
      }
    }

    console.log("Found student:", student)

    if (!student) {
      return NextResponse.json({ error: "Student record not found" }, { status: 404 })
    }

    // Get documents for this student
    let documents = await prisma.document.findMany({
      where: {
        studentId: student.id
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    // Auto-fix document types if they don't match the expected types
    const expectedTypes = [
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

    // Check if we need to fix documents
    const existingTypes = documents.map(d => d.type)
    const needsFix = !expectedTypes.every(type => existingTypes.includes(type)) || 
                     !existingTypes.every(type => expectedTypes.includes(type))

    if (needsFix || documents.length !== expectedTypes.length) {
      console.log("Auto-fixing student documents...")
      
      // Delete existing documents
      await prisma.document.deleteMany({
        where: {
          studentId: student.id
        }
      })
      
      // Create new documents with correct types
      documents = await prisma.document.createMany({
        data: expectedTypes.map(type => ({
          studentId: student.id,
          type,
          status: "MISSING"
        }))
      }).then(() => 
        prisma.document.findMany({
          where: {
            studentId: student.id
          },
          orderBy: {
            type: 'asc'
          }
        })
      )
      
      console.log(`Created ${documents.length} documents for student ${student.name}`)
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

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Forbidden - Students only" }, { status: 403 })
    }

    // Find student record for this user
    let student = await prisma.student.findFirst({
      where: {
        userId: session.user.id
      }
    })

    // Fallback: Try finding by email if userId lookup fails
    if (!student && session.user.email) {
      student = await prisma.student.findFirst({
        where: {
          email: session.user.email
        }
      })
      
      if (student && !student.userId) {
        // Update student record with userId for future lookups
        await prisma.student.update({
          where: { id: student.id },
          data: { userId: session.user.id }
        })
      }
    }

    if (!student) {
      return NextResponse.json({ error: "Student record not found" }, { status: 404 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const type = formData.get("type") as string
    const notes = formData.get("notes") as string | null

    // Debug logging
    console.log("Upload request received:")
    console.log("- File:", file ? `${file.name} (${file.type}, ${file.size} bytes)` : "No file")
    console.log("- Type:", type)
    console.log("- Notes:", notes)

    if (!file || !type) {
      console.log("Validation failed: missing file or type")
      return NextResponse.json(
        { error: "File and document type are required" },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'pdf']
    const fileExtension = file.name.toLowerCase().split('.').pop()
    
    console.log("File validation:")
    console.log("- File type:", file.type)
    console.log("- File extension:", fileExtension)
    console.log("- Allowed types:", allowedTypes)
    console.log("- Allowed extensions:", allowedExtensions)
    
    if (!allowedTypes.includes(file.type) || !allowedExtensions.includes(fileExtension || '')) {
      console.log("Validation failed: invalid file type or extension")
      return NextResponse.json(
        { error: "Only JPEG, PNG and PDF files are allowed" },
        { status: 400 }
      )
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size must be less than 10MB" },
        { status: 400 }
      )
    }

    // Upload file to Cloudinary
    let cloudinaryResult
    try {
      // Create folder structure: student-documents/student-id/document-type
      const folder = `student-documents/${student.id}/${type.toLowerCase().replace(/\s+/g, '-')}`
      cloudinaryResult = await uploadToCloudinary(file, folder)
    } catch (uploadError) {
      console.error("Cloudinary upload error:", uploadError)
      return NextResponse.json(
        { error: "Failed to upload file to cloud storage" },
        { status: 500 }
      )
    }

    // Check if a document of this type already exists
    const existingDocument = await prisma.document.findFirst({
      where: {
        studentId: student.id,
        type: type
      }
    })

    let document
    if (existingDocument) {
      // Update existing document
      document = await prisma.document.update({
        where: { id: existingDocument.id },
        data: {
          fileName: file.name,
          filePath: cloudinaryResult.secure_url,
          type: type,
          status: "UPLOADED",
          notes: notes || null,
          uploadedAt: new Date(),
          uploadedBy: session.user.name || session.user.email || "Unknown"
        }
      })
    } else {
      // Create new document record
      document = await prisma.document.create({
        data: {
          studentId: student.id,
          fileName: file.name,
          filePath: cloudinaryResult.secure_url,
          type: type,
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
