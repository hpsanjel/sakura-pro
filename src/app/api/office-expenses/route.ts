import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Validation schemas
const createExpenseSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  category: z.enum(["RENT", "UTILITIES", "SALARIES", "MARKETING", "EQUIPMENT", "SUPPLIES", "MAINTENANCE", "INSURANCE", "LEGAL", "TRAINING", "TRAVEL", "ENTERTAINMENT", "SUBSCRIPTIONS", "BANKING", "TAX", "MISCELLANEOUS"]),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  expenseMode: z.enum(["CASH", "BANK_TRANSFER", "CREDIT_CARD", "DEBIT_CARD", "CHEQUE", "ONLINE_PAYMENT", "OTHER"]).default("CASH"),
  expenseDate: z.string().optional(),
  receiptUrl: z.string().url().nullable().optional().or(z.literal("")),
  reference: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).default([]),
  isRecurring: z.boolean().default(false),
  recurringType: z.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]).optional(),
  recurringEnd: z.string().optional(),
})

const updateExpenseSchema = createExpenseSchema.partial()

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

// Common expense templates for quick setup
const COMMON_EXPENSE_TEMPLATES = [
  // Utilities
  { title: "Electricity Bill", category: "UTILITIES", suggestedAmount: 150, tags: ["monthly", "essential"] },
  { title: "Internet Bill", category: "UTILITIES", suggestedAmount: 80, tags: ["monthly", "essential"] },
  { title: "Water Bill", category: "UTILITIES", suggestedAmount: 40, tags: ["monthly", "essential"] },
  { title: "Phone Bill", category: "UTILITIES", suggestedAmount: 60, tags: ["monthly", "essential"] },
  
  // Office Supplies
  { title: "Stationery Supplies", category: "SUPPLIES", suggestedAmount: 25, tags: ["monthly", "office"] },
  { title: "Printer Paper", category: "SUPPLIES", suggestedAmount: 15, tags: ["monthly", "office"] },
  { title: "Office Cleaning", category: "MAINTENANCE", suggestedAmount: 100, tags: ["monthly", "essential"] },
  
  // Subscriptions
  { title: "Software Licenses", category: "SUBSCRIPTIONS", suggestedAmount: 50, tags: ["monthly", "software"] },
  { title: "Cloud Storage", category: "SUBSCRIPTIONS", suggestedAmount: 20, tags: ["monthly", "software"] },
  { title: "Antivirus Software", category: "SUBSCRIPTIONS", suggestedAmount: 30, tags: ["yearly", "security"] },
  
  // Marketing
  { title: "Facebook Ads", category: "MARKETING", suggestedAmount: 100, tags: ["marketing", "social"] },
  { title: "Google Ads", category: "MARKETING", suggestedAmount: 150, tags: ["marketing", "digital"] },
  { title: "Business Cards", category: "MARKETING", suggestedAmount: 50, tags: ["one-time", "marketing"] },
  
  // Banking
  { title: "Bank Transaction Fees", category: "BANKING", suggestedAmount: 10, tags: ["monthly", "banking"] },
  { title: "Credit Card Fees", category: "BANKING", suggestedAmount: 25, tags: ["yearly", "banking"] },
  
  // Other
  { title: "Coffee & Tea", category: "MISCELLANEOUS", suggestedAmount: 20, tags: ["weekly", "office"] },
  { title: "Team Lunch", category: "ENTERTAINMENT", suggestedAmount: 80, tags: ["occasional", "team"] },
  { title: "Office Snacks", category: "MISCELLANEOUS", suggestedAmount: 30, tags: ["weekly", "office"] },
]

// GET - Fetch office expenses with filtering
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Restrict access to ADMIN and COUNSELOR only
    if (!['ADMIN', 'COUNSELOR'].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden - Admin/Counselor access required" }, { status: 403 })
    }

    const consultancyId = session.user.consultancyId
    if (!consultancyId) {
      return NextResponse.json({ error: "Consultancy ID not found" }, { status: 400 })
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const expenseMode = searchParams.get("expenseMode")
    const search = searchParams.get("search")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "50")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    // Build filter conditions
    const where: any = { consultancyId }
    
    if (category && category !== "ALL") {
      where.category = category
    }
    
    if (expenseMode && expenseMode !== "ALL") {
      where.expenseMode = expenseMode
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { reference: { contains: search, mode: "insensitive" } },
        { notes: { contains: search, mode: "insensitive" } },
      ]
    }

    if (startDate || endDate) {
      where.expenseDate = {}
      if (startDate) where.expenseDate.gte = new Date(startDate)
      if (endDate) where.expenseDate.lte = new Date(endDate)
    }

    // Get expenses with pagination
    const [expenses, total] = await Promise.all([
      prisma.officeExpense.findMany({
        where,
        orderBy: { expenseDate: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.officeExpense.count({ where }),
    ])

    // Calculate summary statistics
    const summary = await prisma.officeExpense.groupBy({
      by: ["category", "expenseMode"],
      where: { consultancyId },
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    })

    return NextResponse.json({
      expenses,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      summary,
    })
  } catch (error) {
    console.error("Error fetching office expenses:", error)
    return NextResponse.json(
      { error: "Failed to fetch office expenses" },
      { status: 500 }
    )
  }
}

// POST - Create new office expense
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Restrict access to ADMIN and COUNSELOR only
    if (!['ADMIN', 'COUNSELOR'].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden - Admin/Counselor access required" }, { status: 403 })
    }

    const consultancyId = session.user.consultancyId
    if (!consultancyId) {
      return NextResponse.json({ error: "Consultancy ID not found" }, { status: 400 })
    }

    const body = await request.json()
    const validatedData = createExpenseSchema.parse(body)

    const expense = await prisma.officeExpense.create({
      data: {
        ...validatedData,
        consultancyId,
        expenseDate: validatedData.expenseDate ? new Date(validatedData.expenseDate) : new Date(),
        recurringEnd: validatedData.recurringEnd ? new Date(validatedData.recurringEnd) : null,
      },
    })

    return NextResponse.json(expense, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      )
    }

    console.error("Error creating office expense:", error)
    return NextResponse.json(
      { error: "Failed to create office expense" },
      { status: 500 }
    )
  }
}
