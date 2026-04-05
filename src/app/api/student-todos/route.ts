import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { TASK_CATEGORIES } from "@/lib/taskTemplates"

// Validation schemas
const createTodoSchema = z.object({
  studentId: z.string(),
  categoryId: z.string(),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional().nullable(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  dueDate: z.string().datetime().optional().nullable(),
  notes: z.string().optional().nullable(),
  checklistItems: z.array(z.string()).default([]),
  helpfulLinks: z.array(z.string()).default([]),
  estimatedDays: z.number().int().optional().nullable(),
  counselorNotes: z.string().optional().nullable(),
})

const updateTodoSchema = createTodoSchema.partial().extend({
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED", "OVERDUE", "BLOCKED"]).optional(),
  counselorNotes: z.string().optional().nullable(),
})

const createCategorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  description: z.string().optional().nullable(),
  color: z.string().default("#3B82F6"),
  icon: z.string().optional(),
  order: z.number().int().default(0),
})

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
})

// GET - Fetch student todos with filtering and search
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
    const studentId = searchParams.get("studentId")
    const categoryId = searchParams.get("categoryId")
    const status = searchParams.get("status")
    const priority = searchParams.get("priority")
    const search = searchParams.get("search")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "50")

    // Build filter conditions based on user role
    let where: any = { consultancyId }
    
    if (session.user.role === 'STUDENT') {
      // Students can only see their own todos - find their student record first
      const student = await prisma.student.findFirst({
        where: {
          userId: session.user.id,
          consultancyId
        }
      })
      
      if (!student) {
        return NextResponse.json({ todos: [] })
      }
      
      where.studentId = student.id
    } else if (studentId && ['ADMIN', 'COUNSELOR'].includes(session.user.role)) {
      // Admin/Counselor can filter by student
      where.studentId = studentId
    }
    
    if (categoryId && categoryId !== "ALL") {
      where.categoryId = categoryId
    }
    
    if (status && status !== "ALL") {
      where.status = status
    }
    
    if (priority && priority !== "ALL") {
      where.priority = priority
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { notes: { contains: search, mode: "insensitive" } },
      ]
    }

    // Get todos with pagination
    const [todos, total] = await Promise.all([
      prisma.studentTodo.findMany({
        where,
        orderBy: [
          { priority: "desc" },
          { dueDate: "asc" },
          { createdAt: "desc" },
        ],
        skip: (page - 1) * limit,
        take: limit,
        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          category: true,
          template: true,
          checklistItems: {
            orderBy: { createdAt: "asc" },
          },
          _count: {
            select: {
              checklistItems: true,
            },
          },
        },
      }),
      prisma.studentTodo.count({ where }),
    ])

    // Calculate summary statistics
    const summary = await prisma.studentTodo.groupBy({
      by: ["status", "priority", "categoryId"],
      where: {
        consultancyId,
        ...(session.user.role === 'STUDENT' ? { studentId: session.user.id } : {}),
        ...(studentId && session.user.role !== 'STUDENT' ? { studentId } : {}),
      },
      _count: {
        id: true,
      },
    })

    return NextResponse.json({
      todos,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      summary,
    })
  } catch (error) {
    console.error("Error fetching student todos:", error)
    return NextResponse.json(
      { error: "Failed to fetch student todos" },
      { status: 500 }
    )
  }
}

// POST - Create new student todo
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only ADMIN and COUNSELOR can create todos for students
    if (!['ADMIN', 'COUNSELOR'].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const consultancyId = session.user.consultancyId
    if (!consultancyId) {
      return NextResponse.json({ error: "Consultancy ID not found" }, { status: 400 })
    }

    const body = await request.json()
    const validatedData = createTodoSchema.parse(body)

    // Verify student exists and belongs to consultancy
    const student = await prisma.student.findFirst({
      where: {
        id: validatedData.studentId,
        consultancyId,
      },
    })

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    // Verify category exists and belongs to consultancy, or create it if it doesn't exist
    let category = await prisma.todoCategory.findFirst({
      where: {
        id: validatedData.categoryId,
        consultancyId,
      },
    })

    // If category doesn't exist, create it (for template categories)
    if (!category) {
      // Find the template category data
      const templateCategory = TASK_CATEGORIES.find((cat: any) => cat.id === validatedData.categoryId)
      
      if (templateCategory) {
        // Check if category exists with same name for this consultancy (to avoid duplicates)
        const existingCategory = await prisma.todoCategory.findFirst({
          where: {
            name: templateCategory.name,
            consultancyId,
          },
        })

        if (existingCategory) {
          // Use existing category with same name
          category = existingCategory
          console.log(`✅ Using existing category: ${templateCategory.name}`)
        } else {
          // Create the category in the database
          category = await prisma.todoCategory.create({
            data: {
              id: `${consultancyId}_${templateCategory.id}`, // Make ID unique per consultancy
              name: templateCategory.name,
              description: `${templateCategory.name} tasks`,
              color: templateCategory.color,
              icon: templateCategory.icon,
              order: TASK_CATEGORIES.indexOf(templateCategory),
              consultancyId,
            },
          })
          console.log(`✅ Auto-created category: ${templateCategory.name}`)
        }
      } else {
        // If it's not a template category, create a default one
        category = await prisma.todoCategory.create({
          data: {
            id: `${consultancyId}_${validatedData.categoryId}`, // Make ID unique per consultancy
            name: "Custom Category",
            description: "Custom task category",
            color: "#3B82F6",
            consultancyId,
          },
        })
        console.log(`✅ Auto-created custom category: ${validatedData.categoryId}`)
      }
    }

    // Create todo
    const todo = await prisma.studentTodo.create({
      data: {
        studentId: validatedData.studentId,
        categoryId: validatedData.categoryId,
        title: validatedData.title,
        description: validatedData.description,
        priority: validatedData.priority,
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
        estimatedDays: validatedData.estimatedDays,
        counselorNotes: validatedData.counselorNotes,
        helpfulLinks: validatedData.helpfulLinks,
        consultancyId,
        assignedBy: session.user.id,
        checklistItems: {
          create: validatedData.checklistItems.map((item: string) => ({
            title: item,
          })),
        },
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        category: true,
        checklistItems: true,
      },
    })

    return NextResponse.json(todo, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      )
    }

    console.error("Error creating student todo:", error)
    return NextResponse.json(
      { error: "Failed to create student todo" },
      { status: 500 }
    )
  }
}
