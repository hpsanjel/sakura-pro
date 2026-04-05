import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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

// POST - Initialize common expense templates
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only ADMIN can initialize templates
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const consultancyId = session.user.consultancyId
    if (!consultancyId) {
      return NextResponse.json({ error: "Consultancy ID not found" }, { status: 400 })
    }

    // Check if templates already exist
    const existingTemplates = await prisma.officeExpenseTemplate.count({
      where: { consultancyId }
    })

    if (existingTemplates > 0) {
      return NextResponse.json({ 
        message: "Templates already initialized",
        count: existingTemplates 
      })
    }

    // Create common templates
    const templates = await prisma.officeExpenseTemplate.createMany({
      data: COMMON_EXPENSE_TEMPLATES.map(template => ({
        ...template,
        consultancyId,
        category: template.category as any,
        expenseMode: "CASH",
      })),
    })

    return NextResponse.json({ 
      message: "Common expense templates initialized",
      count: templates.count 
    })
  } catch (error) {
    console.error("Error initializing templates:", error)
    return NextResponse.json(
      { error: "Failed to initialize templates" },
      { status: 500 }
    )
  }
}
