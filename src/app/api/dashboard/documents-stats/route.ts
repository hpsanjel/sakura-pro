import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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

// GET - Fetch document statistics for the dashboard
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only ADMIN and COUNSELOR can view stats
    if (session.user.role !== 'ADMIN' && session.user.role !== 'COUNSELOR') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get all students for the consultancy
    const students = await prisma.student.findMany({
      where: {
        consultancyId: session.user.consultancyId
      },
      include: {
        documents: true
      }
    })

    const totalStudents = students.length
    const totalRequiredDocuments = totalStudents * REQUIRED_DOCUMENT_TYPES.length
    
    // Calculate document statistics
    let uploadedDocuments = 0
    let verifiedDocuments = 0
    let rejectedDocuments = 0

    students.forEach(student => {
      student.documents.forEach(document => {
        if (document.status === "UPLOADED") {
          uploadedDocuments++
        } else if (document.status === "VERIFIED") {
          verifiedDocuments++
        } else if (document.status === "REJECTED") {
          rejectedDocuments++
        }
      })
    })

    const missingDocuments = totalRequiredDocuments - uploadedDocuments - verifiedDocuments - rejectedDocuments

    const stats = {
      totalStudents,
      totalDocuments: totalRequiredDocuments,
      missingDocuments,
      uploadedDocuments,
      verifiedDocuments,
      rejectedDocuments
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Error fetching document stats:", error)
    return NextResponse.json(
      { error: "Failed to fetch document statistics" },
      { status: 500 }
    )
  }
}
