import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// PUT - Toggle checklist item completion
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id: todoId, itemId } = await params
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
        id: todoId,
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

    // Find the checklist item
    const checklistItem = await prisma.todoChecklistItem.findFirst({
      where: {
        id: itemId,
        todoId: todoId,
      },
    })

    if (!checklistItem) {
      return NextResponse.json({ error: "Checklist item not found" }, { status: 404 })
    }

    // Toggle the completion status
    const updatedItem = await prisma.todoChecklistItem.update({
      where: { id: itemId },
      data: {
        isCompleted: !checklistItem.isCompleted,
        completedAt: !checklistItem.isCompleted ? new Date() : null,
      },
    })

    // Check if all checklist items are completed to potentially update todo status
    const allChecklistItems = await prisma.todoChecklistItem.findMany({
      where: { todoId: todoId },
    })

    const allCompleted = allChecklistItems.length > 0 && allChecklistItems.every(item => item.isCompleted)

    // Update todo status based on checklist completion
    if (allCompleted) {
      // Mark todo as completed if all items are checked
      await prisma.studentTodo.update({
        where: { id: todoId },
        data: { 
          status: 'COMPLETED',
          completedDate: new Date(),
          completedBy: session.user.id,
        },
      })
    } else {
      // If not all items are completed and todo was marked as completed,
      // reset it to IN_PROGRESS
      await prisma.studentTodo.update({
        where: { id: todoId },
        data: { 
          status: 'IN_PROGRESS',
          completedDate: null,
          completedBy: null,
        },
      })
    }

    return NextResponse.json(updatedItem)
  } catch (error) {
    console.error("Error toggling checklist item:", error)
    return NextResponse.json(
      { error: "Failed to toggle checklist item" },
      { status: 500 }
    )
  }
}

// DELETE - Delete checklist item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id: todoId, itemId } = await params
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
        id: todoId,
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

    // Delete the checklist item
    await prisma.todoChecklistItem.delete({
      where: { id: itemId },
    })

    return NextResponse.json({ message: "Checklist item deleted successfully" })
  } catch (error) {
    console.error("Error deleting checklist item:", error)
    return NextResponse.json(
      { error: "Failed to delete checklist item" },
      { status: 500 }
    )
  }
}
