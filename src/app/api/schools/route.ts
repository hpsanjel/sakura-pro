import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Validation schema for creating a school
const createSchoolSchema = z.object({
  name: z.string().min(1, "School name is required"),
  address: z.string().optional(),
  website: z.string().optional().transform(val => {
    // Allow empty string or valid URL
    if (!val || val.trim() === '') return null
    try {
      new URL(val)
      return val
    } catch {
      // If invalid URL, return null instead of throwing error
      return null
    }
  }),
  isPartner: z.boolean().optional(),
})

// GET - Fetch all schools for the consultancy
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    console.log("Schools API called with role:", session?.user?.role)
    console.log("Consultancy ID:", session?.user?.consultancyId)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only ADMIN and COUNSELOR can view schools
    if (session.user.role !== "ADMIN" && session.user.role !== "COUNSELOR") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const isPartner = searchParams.get('isPartner')
    
    console.log("Is partner filter:", isPartner)

    const where: any = {
      consultancyId: session.user.consultancyId,
    }

    if (isPartner === 'true') {
      where.isPartner = true
    }
    
    console.log("Where clause:", where)

    const schools = await prisma.school.findMany({
      where,
      include: {
        _count: {
          select: {
            applications: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    console.log("Found schools:", schools.length)
    console.log("School names:", schools.map(s => s.name))

    return NextResponse.json(schools)
  } catch (error) {
    console.error("Error fetching schools:", error)
    return NextResponse.json(
      { error: "Failed to fetch schools" },
      { status: 500 }
    )
  }
}

// POST - Create a new school
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    console.log("POST /api/schools - Session:", session?.user?.role, session?.user?.consultancyId)
    
    if (!session) {
      console.log("No session found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only ADMIN can create schools
    if (session.user.role !== "ADMIN") {
      console.log("User not ADMIN:", session.user.role)
      return NextResponse.json({ error: "Forbidden - Only ADMIN can create schools" }, { status: 403 })
    }

    const body = await request.json()
    console.log("Request body:", body)
    
    const validatedData = createSchoolSchema.parse(body)
    console.log("Validated data:", validatedData)

    // Check if school with same name already exists for this consultancy
    const existingSchool = await prisma.school.findFirst({
      where: {
        name: validatedData.name,
        consultancyId: session.user.consultancyId,
      },
    })

    if (existingSchool) {
      console.log("School already exists:", existingSchool.name)
      return NextResponse.json(
        { error: "A school with this name already exists" },
        { status: 400 }
      )
    }

    console.log("Creating school with data:", {
      name: validatedData.name,
      address: validatedData.address || null,
      website: validatedData.website || null,
      isPartner: validatedData.isPartner || false,
      consultancyId: session.user.consultancyId,
    })

    // Create the school
    const school = await prisma.school.create({
      data: {
        name: validatedData.name,
        address: validatedData.address || null,
        website: validatedData.website || null,
        isPartner: validatedData.isPartner || false,
        consultancyId: session.user.consultancyId,
      },
      include: {
        _count: {
          select: {
            applications: true,
          },
        },
      },
    })

    console.log("School created successfully:", school)
    return NextResponse.json(school, { status: 201 })
  } catch (error) {
    console.error("Error creating school:", error)
    
    if (error instanceof z.ZodError) {
      console.log("Validation error:", error.issues)
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      )
    }

    console.error("Database/Server error:", error)
    return NextResponse.json(
      { error: "Failed to create school" },
      { status: 500 }
    )
  }
}
