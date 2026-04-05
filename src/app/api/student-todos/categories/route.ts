import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createCategorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  description: z.string().optional().nullable(),
  color: z.string().default("#3B82F6"),
  icon: z.string().optional(),
  order: z.number().int().default(0),
  isActive: z.boolean().default(true),
})

// GET - Fetch todo categories
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

    const categories = await prisma.todoCategory.findMany({
      where: {
        consultancyId,
        isActive: true,
      },
      orderBy: {
        order: "asc",
      },
      include: {
        _count: {
          select: {
            todos: {
              where: {
                status: {
                  in: ["PENDING", "IN_PROGRESS"]
                }
              }
            },
            templates: true,
          },
        },
      },
    })

    // Remove duplicates by keeping only the first occurrence of each category name
    const uniqueCategories = categories.filter((category, index, self) => 
      index === self.findIndex((c) => c.name === category.name)
    )

    // If we had duplicates, log them and clean them up
    if (categories.length > uniqueCategories.length) {
      console.log("🔍 Found duplicates, cleaning up...")
      
      // Group by name to find duplicates
      const categoriesByName: Record<string, typeof categories> = categories.reduce((groups, category) => {
        if (!groups[category.name]) {
          groups[category.name] = []
        }
        groups[category.name].push(category)
        return groups
      }, {} as Record<string, typeof categories>)

      // Process duplicates and clean them up
      for (const [categoryName, categoryList] of Object.entries(categoriesByName)) {
        if (categoryList.length > 1) {
          // Sort by creation date to keep the oldest one
          categoryList.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
          
          // Keep the first (oldest) category, delete the rest
          const [keepCategory, ...deleteCategories] = categoryList
          
          console.log(`🧹 Cleaning up duplicates for "${categoryName}": keeping ${keepCategory.id}, deleting ${deleteCategories.map(c => c.id).join(', ')}`)
          
          // Update todos and templates to point to the kept category before deleting duplicates
          for (const deleteCategory of deleteCategories) {
            // Update todos
            await prisma.studentTodo.updateMany({
              where: {
                categoryId: deleteCategory.id
              },
              data: {
                categoryId: keepCategory.id
              }
            })

            // Update templates
            await prisma.todoTemplate.updateMany({
              where: {
                categoryId: deleteCategory.id
              },
              data: {
                categoryId: keepCategory.id
              }
            })

            // Delete the duplicate category
            await prisma.todoCategory.delete({
              where: {
                id: deleteCategory.id
              }
            })
          }
        }
      }
    }

    console.log("🔍 Raw categories count:", categories.length)
    console.log("🔍 Unique categories count:", uniqueCategories.length)
    console.log("🔍 Category names:", categories.map(c => ({ id: c.id, name: c.name })))

    return NextResponse.json({ categories: uniqueCategories })
  } catch (error) {
    console.error("Error fetching todo categories:", error)
    return NextResponse.json(
      { error: "Failed to fetch todo categories" },
      { status: 500 }
    )
  }
}

// POST - Create new todo category
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only ADMIN and COUNSELOR can create categories
    if (!['ADMIN', 'COUNSELOR'].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const consultancyId = session.user.consultancyId
    if (!consultancyId) {
      return NextResponse.json({ error: "Consultancy ID not found" }, { status: 400 })
    }

    const body = await request.json()
    const validatedData = createCategorySchema.parse(body)

    // Check if category name already exists
    const existingCategory = await prisma.todoCategory.findFirst({
      where: {
        consultancyId,
        name: validatedData.name,
      },
    })

    if (existingCategory) {
      return NextResponse.json(
        { error: "Category name already exists" },
        { status: 400 }
      )
    }

    // Create category
    const category = await prisma.todoCategory.create({
      data: {
        ...validatedData,
        consultancyId,
      },
      include: {
        _count: {
          select: {
            todos: true,
            templates: true,
          },
        },
      },
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      )
    }

    console.error("Error creating todo category:", error)
    return NextResponse.json(
      { error: "Failed to create todo category" },
      { status: 500 }
    )
  }
}
