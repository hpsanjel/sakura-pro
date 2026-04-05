import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const generateTodosSchema = z.object({
  studentId: z.string(),
  templateIds: z.array(z.string()),
  targetStage: z.enum([
    "INITIAL_ENQUIRY", "DOCUMENTATION", "APPLICATION_SUBMITTED", 
    "APPLICATION_PROCESSING", "OFFER_RECEIVED", "ACCEPTANCE_CONFIRMED",
    "VISA_APPLICATION", "VISA_PROCESSING", "VISA_APPROVED", "PRE_DEPARTURE",
    "FLIGHT_BOOKING", "ACCOMMODATION_SETUP", "PACKING_PREPARATION",
    "DEPARTURE", "POST_ARRIVAL"
  ]).optional(),
  customDueDate: z.string().datetime().optional(),
})

// POST - Generate todos from templates for a student
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only ADMIN and COUNSELOR can generate todos
    if (!['ADMIN', 'COUNSELOR'].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const consultancyId = session.user.consultancyId
    if (!consultancyId) {
      return NextResponse.json({ error: "Consultancy ID not found" }, { status: 400 })
    }

    const body = await request.json()
    const validatedData = generateTodosSchema.parse(body)

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

    // Get templates
    let templates
    if (validatedData.templateIds && validatedData.templateIds.length > 0) {
      // Get specific templates
      templates = await prisma.todoTemplate.findMany({
        where: {
          id: { in: validatedData.templateIds },
          consultancyId,
          isActive: true,
        },
      })
    } else if (validatedData.targetStage) {
      // Get all templates for target stage
      templates = await prisma.todoTemplate.findMany({
        where: {
          consultancyId,
          targetStage: validatedData.targetStage,
          isActive: true,
        },
      })
    } else {
      return NextResponse.json(
        { error: "Either templateIds or targetStage must be provided" },
        { status: 400 }
      )
    }

    if (templates.length === 0) {
      return NextResponse.json({ error: "No templates found" }, { status: 404 })
    }

    // Generate todos from templates
    const generatedTodos = []
    const now = new Date()

    for (const template of templates) {
      // Calculate due date
      let dueDate = null
      if (validatedData.customDueDate) {
        dueDate = new Date(validatedData.customDueDate)
      } else if (template.estimatedDays) {
        dueDate = new Date(now.getTime() + (template.estimatedDays * 24 * 60 * 60 * 1000))
      }

      // Create todo from template
      const todo = await prisma.studentTodo.create({
        data: {
          studentId: validatedData.studentId,
          consultancyId,
          templateId: template.id,
          categoryId: template.categoryId,
          title: template.title,
          description: template.description,
          priority: template.priority,
          status: "PENDING",
          assignedDate: now,
          dueDate: dueDate,
          assignedBy: session.user.id,
          helpfulLinks: template.helpfulLinks,
          estimatedDays: template.estimatedDays,
        },
        include: {
          category: true,
          checklistItems: true,
        },
      })

      generatedTodos.push(todo)
    }

    return NextResponse.json({
      message: `Generated ${generatedTodos.length} todos for ${student.name}`,
      todos: generatedTodos,
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      )
    }

    console.error("Error generating todos:", error)
    return NextResponse.json(
      { error: "Failed to generate todos" },
      { status: 500 }
    )
  }
}
