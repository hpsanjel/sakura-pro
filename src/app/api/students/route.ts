import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Validation schema for creating a student
const createStudentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  passportNumber: z.string().optional(),
  dateOfBirth: z.string().optional(),
  phone: z.string().min(1, "Phone is required"),
  address: z.string().min(1, "Address is required"),
  email: z.string().email("Valid email is required"),
  education: z.string().optional(),
  japaneseLanguageLevel: z.enum(["N1", "N2", "N3", "N4", "N5"]).optional(),
  intake: z.enum(["April", "July", "October", "January"]).optional(),
  visaStatus: z.enum(["NEW_LEAD", "DOCS_PENDING", "DOCS_VERIFIED", "SENT_TO_JAPAN", "COE_APPLIED", "COE_APPROVED", "VISA_APPLIED", "VISA_APPROVED", "REJECTED"]).optional(),
  studyGoals: z.string().optional(),
  preferredStudyField: z.string().optional(),
  workExperience: z.string().optional(),
  financialProof: z.string().optional(),
  category: z.enum(["VISITOR", "PROSPECT", "APPLIED", "COMMITTED", "ENROLLED", "ALUMNI"]).optional(),
}).transform((data) => ({
  ...data,
  dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
  passportNumber: data.passportNumber || null,
}))

// GET - Fetch all students for the user's consultancy
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(request.url)
    const includeAllYears = searchParams.get('includeAllYears') === 'true'
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const consultancyId = session.user.consultancyId
    const userRole = session.user.role
    
    // Handle different user roles
    if (!consultancyId && userRole !== "SUPERADMIN") {
      return NextResponse.json({ error: "Consultancy ID not found" }, { status: 400 })
    }

    // For SUPERADMIN, get all students or allow them to specify a consultancy
    let yearFilter = {}
    let selectedYear: number
    if (userRole === "SUPERADMIN") {
      // For SUPERADMIN, use current year or first available consultancy's year
      const currentYear = new Date().getFullYear()
      selectedYear = currentYear
    } else if (!includeAllYears) {
      // Get consultancy's selected year (consultancy-wide year)
      const consultancy = await prisma.consultancy.findUnique({
        where: { id: consultancyId },
        select: { selectedYear: true }
      })

      if (!consultancy) {
        return NextResponse.json({ error: "Consultancy not found" }, { status: 404 })
      }

      selectedYear = consultancy.selectedYear
      
      // Create year filter for date-based queries (only if not including all years)
      yearFilter = {
        createdAt: {
          gte: new Date(`${selectedYear}-01-01`),
          lt: new Date(`${selectedYear + 1}-01-01`)
        }
      }
    }
    // If includeAllYears is true, don't apply any year filter

    // Only ADMIN, COUNSELOR, and SUPERADMIN can view students
    if (!['ADMIN', 'COUNSELOR', 'SUPERADMIN'].includes(session.user.role || '')) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Build query based on user role
    const whereClause: any = {
      ...yearFilter
    }

    if (userRole === "SUPERADMIN") {
      // SUPERADMIN can see all students
      // No consultancy filter needed
    } else {
      // ADMIN and COUNSELOR can only see students from their consultancy
      whereClause.consultancyId = consultancyId
    }

    const students = await prisma.student.findMany({
      where: whereClause,
      include: {
        documents: {
          select: {
            id: true,
            type: true,
            status: true,
            fileName: true,
            filePath: true,
            notes: true,
            uploadedAt: true,
            uploadedBy: true,
            verifiedAt: true,
            verifiedBy: true,
            rejectedAt: true,
            rejectedBy: true,
            createdAt: true
          }
        },
        sponsors: {
          select: {
            name: true,
            relation: true,
          }
        },
        applications: {
          include: {
            school: {
              select: {
                name: true,
              }
            }
          }
        },
        _count: {
          select: {
            documents: true,
            sponsors: true,
            applications: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log("Found students:", students.length)
    console.log("Student names:", students.map(s => s.name))
    
    return NextResponse.json(students)
  } catch (error) {
    console.error("Error fetching students:", error)
    return NextResponse.json(
      { error: "Failed to fetch students" },
      { status: 500 }
    )
  }
}

// POST - Create a new student
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only ADMIN and COUNSELOR can create students
    if (session.user.role !== 'ADMIN' && session.user.role !== 'COUNSELOR') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    console.log("Received student data:", body)
    
    try {
      const validatedData = createStudentSchema.parse(body)
      console.log("Validated data:", validatedData)
      
      // Check if passport number already exists in this consultancy (only if provided)
      if (validatedData.passportNumber) {
        const existingStudent = await prisma.student.findFirst({
          where: {
            passportNumber: validatedData.passportNumber,
            consultancyId: session.user.consultancyId
          }
        })

        if (existingStudent) {
          return NextResponse.json(
            { error: "Passport number already exists" },
            { status: 409 }
          )
        }
      }

      // Prepare data for Prisma - handle optional fields properly
      const studentData: any = {
        name: validatedData.name,
        phone: validatedData.phone,
        address: validatedData.address,
        consultancyId: session.user.consultancyId,
      }

      // Add optional fields only if they exist
      if (validatedData.passportNumber) studentData.passportNumber = validatedData.passportNumber
      if (validatedData.dateOfBirth) studentData.dateOfBirth = validatedData.dateOfBirth
      if (validatedData.education) studentData.education = validatedData.education
      if (validatedData.japaneseLanguageLevel) studentData.japaneseLanguageLevel = validatedData.japaneseLanguageLevel
      if (validatedData.intake) studentData.intake = validatedData.intake
      if (validatedData.visaStatus) studentData.visaStatus = validatedData.visaStatus
      if (validatedData.studyGoals) studentData.studyGoals = validatedData.studyGoals
      if (validatedData.preferredStudyField) studentData.preferredStudyField = validatedData.preferredStudyField
      if (validatedData.workExperience) studentData.workExperience = validatedData.workExperience
      if (validatedData.financialProof) studentData.financialProof = validatedData.financialProof
      if (validatedData.category) studentData.category = validatedData.category
      if (validatedData.email) studentData.email = validatedData.email
      
      console.log("Final student data for Prisma:", studentData)

      const student = await prisma.student.create({
        data: studentData,
        include: {
          documents: true,
          sponsors: true,
          applications: true,
        }
      })

      return NextResponse.json(student, { status: 201 })
    } catch (error) {
      console.error("Error creating student:", error)
      
      if (error instanceof z.ZodError) {
        const fieldErrors = error.issues.reduce((acc, issue) => {
          const field = typeof issue.path[0] === 'string' ? issue.path[0] as string : 'unknown'
          acc[field] = issue.message
          return acc
        }, {} as Record<string, string>)
        
        console.log("Field errors:", fieldErrors)
        
        return NextResponse.json(
          { error: "Validation failed", fieldErrors },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { error: "Failed to create student" },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Error creating student:", error)
    return NextResponse.json(
      { error: "Failed to create student" },
      { status: 500 }
    )
  }
}

