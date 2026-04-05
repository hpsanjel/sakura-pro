import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateTodoSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED", "OVERDUE", "BLOCKED"]).optional(),
  dueDate: z.string().datetime().optional().nullable(),
  notes: z.string().optional().nullable(),
  counselorNotes: z.string().optional().nullable(),
  checklistItems: z.array(z.string()).optional(),
  helpfulLinks: z.array(z.string()).optional(),
  estimatedDays: z.number().int().optional().nullable(),
})

const createChecklistItemSchema = z.object({
  title: z.string().min(1, "Checklist item title is required"),
})

// GET - Fetch single student todo
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const consultancyId = session.user.consultancyId
    if (!consultancyId) {
      return NextResponse.json({ error: "Consultancy ID not found" }, { status: 400 })
    }

    const todo = await prisma.studentTodo.findFirst({
      where: {
        id: id,
        consultancyId,
        ...(session.user.role === 'STUDENT' ? {
          studentId: (await prisma.student.findFirst({
            where: { userId: session.user.id, consultancyId }
          }))?.id
        } : {}),
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
        template: true,
        checklistItems: {
          orderBy: { createdAt: "asc" },
        },
      },
    })

    if (!todo) {
      return NextResponse.json({ error: "Todo not found" }, { status: 404 })
    }

    return NextResponse.json(todo)
  } catch (error) {
    console.error("Error fetching student todo:", error)
    return NextResponse.json(
      { error: "Failed to fetch student todo" },
      { status: 500 }
    )
  }
}

// PUT - Update student todo
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const consultancyId = session.user.consultancyId
    if (!consultancyId) {
      return NextResponse.json({ error: "Consultancy ID not found" }, { status: 400 })
    }

    const body = await request.json()
    const validatedData = updateTodoSchema.parse(body)

    // Check if todo exists and user has access
    const existingTodo = await prisma.studentTodo.findFirst({
      where: {
        id: id,
        consultancyId,
        ...(session.user.role === 'STUDENT' ? {
          studentId: (await prisma.student.findFirst({
            where: { userId: session.user.id, consultancyId }
          }))?.id
        } : {}),
      },
    })

    if (!existingTodo) {
      return NextResponse.json({ error: "Todo not found" }, { status: 404 })
    }

    // Prepare update data
    const updateData: any = {
      ...validatedData,
      updatedAt: new Date(),
    }

    // Remove checklistItems from updateData as it's handled separately
    delete updateData.checklistItems

    // Handle status changes
    if (validatedData.status) {
      if (validatedData.status === "COMPLETED" && existingTodo.status !== "COMPLETED") {
        updateData.completedDate = new Date()
        updateData.completedBy = session.user.id
        
        // Calculate actual days taken
        if (existingTodo.assignedDate) {
          const actualDays = Math.ceil(
            (new Date().getTime() - new Date(existingTodo.assignedDate).getTime()) / (1000 * 60 * 60 * 24)
          )
          updateData.actualDays = actualDays
        }
      } else if (validatedData.status !== "COMPLETED" && existingTodo.status === "COMPLETED") {
        // Un-completing the todo
        updateData.completedDate = null
        updateData.completedBy = null
        updateData.actualDays = null
      }
    }

    // Handle checklist items update
    if (validatedData.checklistItems !== undefined) {
      // Get existing checklist items
      const existingItems = await prisma.todoChecklistItem.findMany({
        where: { todoId: id },
        select: { id: true, title: true, isCompleted: true, completedAt: true }
      })
      
      // Create a map of existing items by title for easy lookup
      const existingItemsMap = new Map(
        existingItems.map(item => [item.title, item])
      )
      
      // Find new items (not in existing list)
      const newItems = validatedData.checklistItems!.filter(
        title => !existingItemsMap.has(title)
      )
      
      // Find items to remove (in existing but not in new list)
      const itemsToRemove = existingItems.filter(
        item => !validatedData.checklistItems!.includes(item.title)
      )
      
      // Remove items that are no longer needed
      if (itemsToRemove.length > 0) {
        await prisma.todoChecklistItem.deleteMany({
          where: {
            id: { in: itemsToRemove.map(item => item.id) }
          }
        })
      }
      
      // Add only the new items (unchecked by default)
      if (newItems.length > 0) {
        await prisma.todoChecklistItem.createMany({
          data: newItems.map(title => ({
            todoId: id,
            title,
            isCompleted: false,
          }))
        })
        
        // If new checklist items were added and todo was previously completed,
        // reset the status to IN_PROGRESS since there are now incomplete items
        if (existingTodo.status === 'COMPLETED') {
          updateData.status = 'IN_PROGRESS'
          updateData.completedDate = null
          updateData.completedBy = null
          updateData.actualDays = null
        }
      }
      
      // If items were removed and all remaining items are completed,
      // check if todo should be marked as completed
      if (itemsToRemove.length > 0) {
        const remainingItems = await prisma.todoChecklistItem.findMany({
          where: { todoId: id }
        })
        
        const allRemainingCompleted = remainingItems.length > 0 && 
          remainingItems.every(item => item.isCompleted)
        
        if (allRemainingCompleted && existingTodo.status !== 'COMPLETED') {
          updateData.status = 'COMPLETED'
          updateData.completedDate = new Date()
          updateData.completedBy = session.user.id
        }
      }
    }

    // Update todo
    const todo = await prisma.studentTodo.update({
      where: { id: id },
      data: updateData,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        category: true,
        checklistItems: {
          orderBy: { createdAt: "asc" },
        },
      },
    })

    return NextResponse.json(todo)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      )
    }

    console.error("Error updating student todo:", error)
    return NextResponse.json(
      { error: "Failed to update student todo" },
      { status: 500 }
    )
  }
}

// DELETE - Delete student todo
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only ADMIN and COUNSELOR can delete todos
    if (!['ADMIN', 'COUNSELOR'].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const consultancyId = session.user.consultancyId
    if (!consultancyId) {
      return NextResponse.json({ error: "Consultancy ID not found" }, { status: 400 })
    }

    // Check if todo exists and belongs to consultancy
    const existingTodo = await prisma.studentTodo.findFirst({
      where: {
        id: id,
        consultancyId,
      },
    })

    if (!existingTodo) {
      return NextResponse.json({ error: "Todo not found" }, { status: 404 })
    }

    // Delete todo (cascade will handle checklist items)
    await prisma.studentTodo.delete({
      where: { id: id },
    })

    return NextResponse.json({ message: "Todo deleted successfully" })
  } catch (error) {
    console.error("Error deleting student todo:", error)
    return NextResponse.json(
      { error: "Failed to delete student todo" },
      { status: 500 }
    )
  }
}

// POST - Add checklist item to todo
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const consultancyId = session.user.consultancyId
    if (!consultancyId) {
      return NextResponse.json({ error: "Consultancy ID not found" }, { status: 400 })
    }

    // Check if todo exists and user has access
    const existingTodo = await prisma.studentTodo.findFirst({
      where: {
        id: id,
        consultancyId,
        ...(session.user.role === 'STUDENT' ? {
          studentId: (await prisma.student.findFirst({
            where: { userId: session.user.id, consultancyId }
          }))?.id
        } : {}),
      },
    })

    if (!existingTodo) {
      return NextResponse.json({ error: "Todo not found" }, { status: 404 })
    }

    const body = await request.json()
    const validatedData = createChecklistItemSchema.parse(body)

    // Create checklist item
    const checklistItem = await prisma.todoChecklistItem.create({
      data: {
        todoId: id,
        title: validatedData.title,
        isCompleted: false,
      },
    })

    return NextResponse.json(checklistItem, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      )
    }

    console.error("Error creating checklist item:", error)
    return NextResponse.json(
      { error: "Failed to create checklist item" },
      { status: 500 }
    )
  }
}
