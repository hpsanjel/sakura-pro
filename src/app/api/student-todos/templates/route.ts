import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createTemplateSchema = z.object({
  categoryId: z.string(),
  title: z.string().min(1, "Template title is required"),
  description: z.string().optional().nullable(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  estimatedDays: z.number().int().optional().nullable(),
  isRequired: z.boolean().default(true),
  targetStage: z.enum([
    "INITIAL_ENQUIRY", "DOCUMENTATION", "APPLICATION_SUBMITTED", 
    "APPLICATION_PROCESSING", "OFFER_RECEIVED", "ACCEPTANCE_CONFIRMED",
    "VISA_APPLICATION", "VISA_PROCESSING", "VISA_APPROVED", "PRE_DEPARTURE",
    "FLIGHT_BOOKING", "ACCOMMODATION_SETUP", "PACKING_PREPARATION",
    "DEPARTURE", "POST_ARRIVAL"
  ]),
  checklistItems: z.array(z.string()).default([]),
  helpfulLinks: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
})

// GET - Fetch todo templates
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const consultancyId = session.user.consultancyId
    if (!consultancyId) {
      return NextResponse.json({ error: "Consultancy ID not found" }, { status: 400 })
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get("categoryId")
    const targetStage = searchParams.get("targetStage")
    const search = searchParams.get("search")

    // Build filter conditions
    let where: any = {
      consultancyId,
      isActive: true,
    }
    
    if (categoryId && categoryId !== "ALL") {
      where.categoryId = categoryId
    }
    
    if (targetStage && targetStage !== "ALL") {
      where.targetStage = targetStage
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ]
    }

    const templates = await prisma.todoTemplate.findMany({
      where,
      orderBy: {
        title: "asc",
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true,
          },
        },
        _count: {
          select: {
            todos: true,
          },
        },
      },
    })

    return NextResponse.json({ templates })
  } catch (error) {
    console.error("Error fetching todo templates:", error)
    return NextResponse.json(
      { error: "Failed to fetch todo templates" },
      { status: 500 }
    )
  }
}

// POST - Create new todo template
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only ADMIN and COUNSELOR can create templates
    if (!['ADMIN', 'COUNSELOR'].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const consultancyId = session.user.consultancyId
    if (!consultancyId) {
      return NextResponse.json({ error: "Consultancy ID not found" }, { status: 400 })
    }

    const body = await request.json()
    const validatedData = createTemplateSchema.parse(body)

    // Verify category exists and belongs to consultancy
    const category = await prisma.todoCategory.findFirst({
      where: {
        id: validatedData.categoryId,
        consultancyId,
      },
    })

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 })
    }

    // Create template
    const template = await prisma.todoTemplate.create({
      data: {
        ...validatedData,
        consultancyId,
        dependencies: [], // Empty for now, can be enhanced later
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true,
          },
        },
      },
    })

    return NextResponse.json(template, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      )
    }

    console.error("Error creating todo template:", error)
    return NextResponse.json(
      { error: "Failed to create todo template" },
      { status: 500 }
    )
  }
}
