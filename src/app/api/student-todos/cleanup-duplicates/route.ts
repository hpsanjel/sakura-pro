import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Standard category names that should exist
const STANDARD_CATEGORIES = [
  "Documentation",
  "Application Process", 
  "Financial",
  "Visa & Immigration",
  "Travel & Accommodation",
  "Pre-Departure",
  "Post-Arrival"
]

// POST - Clean up duplicate categories
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only ADMIN can clean up categories
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const consultancyId = session.user.consultancyId
    if (!consultancyId) {
      return NextResponse.json({ error: "Consultancy ID not found" }, { status: 400 })
    }

    console.log("🧹 Starting cleanup of duplicate todo categories...")

    // Get all categories for this consultancy
    const allCategories = await prisma.todoCategory.findMany({
      where: {
        consultancyId
      },
      include: {
        _count: {
          select: {
            todos: true,
            templates: true
          }
        }
      }
    })

    console.log(`📊 Found ${allCategories.length} total categories`)

    // Group categories by name
    const categoriesByName = allCategories.reduce((groups: Record<string, any[]>, category) => {
      if (!groups[category.name]) {
        groups[category.name] = []
      }
      groups[category.name].push(category)
      return groups;
    }, {})

    let deletedCount = 0
    let updatedTodosCount = 0
    let updatedTemplatesCount = 0

    // Process each category name group
    for (const [categoryName, categories] of Object.entries(categoriesByName)) {
      console.log(`\n🔍 Processing category: "${categoryName}" (${(categories as any[]).length} duplicates)`)
      
      if ((categories as any[]).length === 1) {
        console.log(`✅ Only one instance of "${categoryName}" - keeping it`)
        continue
      }

      // Sort by creation date to keep the oldest one
      (categories as any[]).sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      
      // Keep the first (oldest) category, delete the rest
      const [keepCategory, ...deleteCategories] = categories as any[]
      
      console.log(`📌 Keeping: ${keepCategory.id} (created ${keepCategory.createdAt})`)
      console.log(`🗑️  Deleting: ${deleteCategories.map(c => `${c.id} (${c._count.todos} todos, ${c._count.templates} templates)`).join(', ')}`)

      // Update todos and templates to point to the kept category before deleting duplicates
      for (const deleteCategory of deleteCategories) {
        // Update todos
        if (deleteCategory._count.todos > 0) {
          await prisma.studentTodo.updateMany({
            where: {
              categoryId: deleteCategory.id
            },
            data: {
              categoryId: keepCategory.id
            }
          })
          updatedTodosCount += deleteCategory._count.todos
          console.log(`   📝 Updated ${deleteCategory._count.todos} todos to point to kept category`)
        }

        // Update templates
        if (deleteCategory._count.templates > 0) {
          await prisma.todoTemplate.updateMany({
            where: {
              categoryId: deleteCategory.id
            },
            data: {
              categoryId: keepCategory.id
            }
          })
          updatedTemplatesCount += deleteCategory._count.templates
          console.log(`   📋 Updated ${deleteCategory._count.templates} templates to point to kept category`)
        }

        // Delete the duplicate category
        await prisma.todoCategory.delete({
          where: {
            id: deleteCategory.id
          }
        })
        deletedCount++
        console.log(`   🗑️  Deleted category ${deleteCategory.id}`)
      }
    }

    // Get final categories
    const finalCategories = await prisma.todoCategory.findMany({
      where: {
        consultancyId
      },
      orderBy: {
        name: 'asc'
      },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            todos: true,
            templates: true
          }
        }
      }
    })

    console.log(`\n🎉 Cleanup completed!`)
    console.log(`📊 Results:`)
    console.log(`   - Deleted ${deletedCount} duplicate categories`)
    console.log(`   - Updated ${updatedTodosCount} todos`)
    console.log(`   - Updated ${updatedTemplatesCount} templates`)
    console.log(`   - Final category count: ${finalCategories.length}`)

    return NextResponse.json({
      success: true,
      message: "Cleanup completed successfully",
      results: {
        deletedCategories: deletedCount,
        updatedTodos: updatedTodosCount,
        updatedTemplates: updatedTemplatesCount,
        finalCategories: finalCategories.length,
        categories: finalCategories
      }
    })

  } catch (error) {
    console.error("❌ Error cleaning up categories:", error)
    return NextResponse.json(
      { error: "Failed to clean up categories" },
      { status: 500 }
    )
  }
}
