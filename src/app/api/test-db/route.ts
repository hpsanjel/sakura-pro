import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    // Test database connection
    const consultancyCount = await prisma.consultancy.count()
    const studentCount = await prisma.student.count()
    const categoryCount = await prisma.todoCategory.count()
    const templateCount = await prisma.todoTemplate.count()
    
    return NextResponse.json({
      message: "Database connection successful",
      counts: {
        consultancies: consultancyCount,
        students: studentCount,
        todoCategories: categoryCount,
        todoTemplates: templateCount,
      }
    })
  } catch (error) {
    console.error("Database test error:", error)
    return NextResponse.json(
      { error: "Database connection failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
