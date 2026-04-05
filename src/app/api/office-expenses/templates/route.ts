import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createTemplateSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  category: z.enum(["RENT", "UTILITIES", "SALARIES", "MARKETING", "EQUIPMENT", "SUPPLIES", "MAINTENANCE", "INSURANCE", "LEGAL", "TRAINING", "TRAVEL", "ENTERTAINMENT", "SUBSCRIPTIONS", "BANKING", "TAX", "MISCELLANEOUS"]),
  suggestedAmount: z.number().min(0).optional(),
  expenseMode: z.enum(["CASH", "BANK_TRANSFER", "CREDIT_CARD", "DEBIT_CARD", "CHEQUE", "ONLINE_PAYMENT", "OTHER"]).default("CASH"),
  isCommon: z.boolean().default(true),
  isActive: z.boolean().default(true),
  tags: z.array(z.string()).default([]),
})

// GET - Fetch expense templates
export async function GET(request: NextRequest) {
  try {
    // Templates are public, no authentication required for GET
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const isCommon = searchParams.get("isCommon")
    const search = searchParams.get("search")

    // Build filter conditions - for public access, only show common templates
    const where: any = { isActive: true }
    
    if (category && category !== "ALL") {
      where.category = category
    }
    
    if (isCommon === "true") {
      where.isCommon = true
    } else if (isCommon === "false") {
      where.isCommon = false
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ]
    }

    const templates = await prisma.officeExpenseTemplate.findMany({
      where,
      orderBy: [
        { isCommon: "desc" },
        { category: "asc" },
        { title: "asc" },
      ],
    })

    return NextResponse.json({ templates })
  } catch (error) {
    console.error("Error fetching expense templates:", error)
    return NextResponse.json(
      { error: "Failed to fetch expense templates" },
      { status: 500 }
    )
  }
}

// POST - Create new expense template
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only ADMIN and COUNSELOR can create templates
    if (session.user.role !== 'ADMIN' && session.user.role !== 'COUNSELOR') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const consultancyId = session.user.consultancyId
    if (!consultancyId) {
      return NextResponse.json({ error: "Consultancy ID not found" }, { status: 400 })
    }

    const body = await request.json()
    const validatedData = createTemplateSchema.parse(body)

    const template = await prisma.officeExpenseTemplate.create({
      data: {
        ...validatedData,
        consultancyId,
        category: validatedData.category,
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

    console.error("Error creating expense template:", error)
    return NextResponse.json(
      { error: "Failed to create expense template" },
      { status: 500 }
    )
  }
}
