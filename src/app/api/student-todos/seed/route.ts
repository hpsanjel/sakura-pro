import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const TODO_CATEGORIES = [
  {
    name: "Documentation",
    description: "All required documents and paperwork",
    color: "#3B82F6",
    icon: "📄",
    order: 1,
  },
  {
    name: "Application Process",
    description: "School applications and paperwork",
    color: "#8B5CF6",
    icon: "📝",
    order: 2,
  },
  {
    name: "Financial",
    description: "Payments, fees, and financial documentation",
    color: "#10B981",
    icon: "💰",
    order: 3,
  },
  {
    name: "Visa & Immigration",
    description: "Visa applications and immigration requirements",
    color: "#F59E0B",
    icon: "🛂",
    order: 4,
  },
  {
    name: "Travel & Accommodation",
    description: "Flight booking, accommodation, and travel arrangements",
    color: "#EF4444",
    icon: "✈️",
    order: 5,
  },
  {
    name: "Pre-Departure",
    description: "Final preparations before leaving",
    color: "#06B6D4",
    icon: "🎒",
    order: 6,
  },
  {
    name: "Post-Arrival",
    description: "Tasks after arriving in Japan",
    color: "#84CC16",
    icon: "🏠",
    order: 7,
  },
]

const TODO_TEMPLATES = [
  // INITIAL_ENQUIRY STAGE
  {
    title: "Research Japanese Schools and Programs",
    description: "Research and shortlist potential schools and programs in Japan",
    priority: "HIGH",
    estimatedDays: 7,
    isRequired: true,
    targetStage: "INITIAL_ENQUIRY",
    categoryName: "Application Process",
    checklistItems: [
      "Research school rankings and reputation",
      "Compare program curriculums",
      "Check admission requirements",
      "Review tuition fees and costs",
      "Look for scholarship opportunities",
      "Read student reviews and testimonials"
    ],
    helpfulLinks: [
      "https://www.jasso.go.jp/en/study_j/school_e.html",
      "https://www.studyjapan.go.jp/en/",
      "https://www.mext.go.jp/en/"
    ]
  },
  {
    title: "Initial Consultation with Counselor",
    description: "Schedule and attend first consultation meeting",
    priority: "HIGH",
    estimatedDays: 2,
    isRequired: true,
    targetStage: "INITIAL_ENQUIRY",
    categoryName: "Application Process",
    checklistItems: [
      "Schedule appointment with counselor",
      "Prepare questions about study in Japan",
      "Bring academic transcripts",
      "Discuss career goals and study preferences",
      "Get information about application timeline"
    ],
    helpfulLinks: []
  },

  // DOCUMENTATION STAGE
  {
    title: "Gather Academic Documents",
    description: "Collect all required academic transcripts and certificates",
    priority: "HIGH",
    estimatedDays: 5,
    isRequired: true,
    targetStage: "DOCUMENTATION",
    categoryName: "Documentation",
    checklistItems: [
      "Obtain high school transcripts",
      "Get college/university transcripts (if applicable)",
      "Collect graduation certificates",
      "Translate documents if not in English/Japanese",
      "Get documents notarized if required",
      "Make photocopies of all documents"
    ],
    helpfulLinks: []
  },
  {
    title: "Prepare Passport",
    description: "Ensure passport is valid and ready",
    priority: "URGENT",
    estimatedDays: 30,
    isRequired: true,
    targetStage: "DOCUMENTATION",
    categoryName: "Documentation",
    checklistItems: [
      "Check passport expiration date (must be valid for entire stay)",
      "Apply for new passport if expiring soon",
      "Get passport photos taken",
      "Make copies of passport pages",
      "Scan passport for digital applications"
    ],
    helpfulLinks: [
      "https://www.passport.gov.ph/",
      "https://travel.state.gov/content/travel/en/passports.html"
    ]
  },

  // APPLICATION SUBMITTED STAGE
  {
    title: "Complete Online Application Forms",
    description: "Fill out and submit online application forms",
    priority: "HIGH",
    estimatedDays: 3,
    isRequired: true,
    targetStage: "APPLICATION_SUBMITTED",
    categoryName: "Application Process",
    checklistItems: [
      "Create accounts on school application portals",
      "Fill out personal information accurately",
      "Upload required documents",
      "Write application essays if required",
      "Review application before submission",
      "Pay application fees",
      "Submit applications before deadlines"
    ],
    helpfulLinks: []
  },

  // VISA APPLICATION STAGE
  {
    title: "Apply for Student Visa",
    description: "Begin student visa application process",
    priority: "HIGH",
    estimatedDays: 30,
    isRequired: true,
    targetStage: "ACCEPTANCE_CONFIRMED",
    categoryName: "Visa & Immigration",
    checklistItems: [
      "Get Certificate of Eligibility (COE) from school",
      "Complete visa application forms",
      "Prepare visa documents",
      "Schedule visa appointment",
      "Pay visa application fees",
      "Attend visa interview if required"
    ],
    helpfulLinks: [
      "https://www.mofa.go.jp/en/visa/index.html",
      "https://www.ph.emb-japan.go.jp/itpr_en/visa.html"
    ]
  },

  // PRE-DEPARTURE STAGE
  {
    title: "Book Flight Tickets",
    description: "Book flight tickets to Japan",
    priority: "HIGH",
    estimatedDays: 7,
    isRequired: true,
    targetStage: "PRE_DEPARTURE",
    categoryName: "Travel & Accommodation",
    checklistItems: [
      "Research flight options and prices",
      "Check baggage allowance policies",
      "Book flights with arrival before school start",
      "Choose refundable tickets if possible",
      "Get travel insurance",
      "Share flight details with school and family"
    ],
    helpfulLinks: [
      "https://www.jal.co.jp/en/",
      "https://www.ana.co.jp/en/",
      "https://www.skyscanner.net/"
    ]
  },
  {
    title: "Arrange Accommodation",
    description: "Secure accommodation in Japan",
    priority: "URGENT",
    estimatedDays: 14,
    isRequired: true,
    targetStage: "PRE_DEPARTURE",
    categoryName: "Travel & Accommodation",
    checklistItems: [
      "Apply for school dormitory if available",
      "Research off-campus housing options",
      "Contact housing agencies in Japan",
      "Sign lease agreement",
      "Pay deposit and first month rent",
      "Get accommodation details and address"
    ],
    helpfulLinks: [
      "https://www.o-hayo-ichi.com/",
      "https://www.realestate-tokyo.com/"
    ]
  },

  // PACKING PREPARATION STAGE
  {
    title: "Create Packing List",
    description: "Create comprehensive packing list",
    priority: "HIGH",
    estimatedDays: 3,
    isRequired: true,
    targetStage: "PACKING_PREPARATION",
    categoryName: "Pre-Departure",
    checklistItems: [
      "Research Japan weather and climate",
      "List essential clothing items",
      "Plan for electronics and adapters",
      "Include personal items and mementos",
      "Check airline baggage restrictions",
      "Create separate lists for carry-on and checked baggage"
    ],
    helpfulLinks: [
      "https://www.japan-guide.com/e/e2275.html"
    ]
  },
  {
    title: "Pack Luggage",
    description: "Pack all necessary items",
    priority: "HIGH",
    estimatedDays: 5,
    isRequired: true,
    targetStage: "PACKING_PREPARATION",
    categoryName: "Pre-Departure",
    checklistItems: [
      "Pack clothing appropriate for season",
      "Pack toiletries and personal care items",
      "Pack electronics and chargers",
      "Pack important documents in carry-on",
      "Pack some familiar items from home",
      "Weigh luggage to avoid excess fees"
    ],
    helpfulLinks: []
  },

  // POST_ARRIVAL STAGE
  {
    title: "Complete Immigration in Japan",
    description: "Complete arrival procedures in Japan",
    priority: "URGENT",
    estimatedDays: 1,
    isRequired: true,
    targetStage: "POST_ARRIVAL",
    categoryName: "Visa & Immigration",
    checklistItems: [
      "Go through immigration at Japanese airport",
      "Show passport and visa",
      "Get residence card at airport",
      "Complete arrival card",
      "Collect luggage",
      "Clear customs"
    ],
    helpfulLinks: [
      "https://www.immi-moj.go.jp/"
    ]
  },
  {
    title: "Check into Accommodation",
    description: "Check into arranged accommodation",
    priority: "HIGH",
    estimatedDays: 1,
    isRequired: true,
    targetStage: "POST_ARRIVAL",
    categoryName: "Travel & Accommodation",
    checklistItems: [
      "Travel to accommodation",
      "Meet with landlord/manager",
      "Complete check-in procedures",
      "Pay any remaining fees",
      "Get keys and access information",
      "Inspect accommodation condition"
    ],
    helpfulLinks: []
  },
  {
    title: "Register at Local Authorities",
    description: "Complete local registration requirements",
    priority: "HIGH",
    estimatedDays: 7,
    isRequired: true,
    targetStage: "POST_ARRIVAL",
    categoryName: "Visa & Immigration",
    checklistItems: [
      "Register address at local city office",
      "Get My Number card if required",
      "Register for national health insurance",
      "Open Japanese bank account",
      "Get Japanese phone number",
      "Register with school international office"
    ],
    helpfulLinks: [
      "https://www.cas.go.jp/jp/seisaku/juminhyo/",
      "https://www.mhlw.go.jp/english/"
    ]
  }
]

// POST - Seed todo categories and templates
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only ADMIN can seed data
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const consultancyId = session.user.consultancyId
    if (!consultancyId) {
      return NextResponse.json({ error: "Consultancy ID not found" }, { status: 400 })
    }

    // Create categories
    const createdCategories = []
    for (const categoryData of TODO_CATEGORIES) {
      const existingCategory = await prisma.todoCategory.findFirst({
        where: {
          consultancyId,
          name: categoryData.name,
        },
      })

      let category
      if (existingCategory) {
        category = await prisma.todoCategory.update({
          where: { id: existingCategory.id },
          data: categoryData,
        })
      } else {
        category = await prisma.todoCategory.create({
          data: {
            ...categoryData,
            consultancyId,
          },
        })
      }
      createdCategories.push(category)
    }

    // Create templates
    for (const templateData of TODO_TEMPLATES) {
      const category = createdCategories.find(c => c.name === templateData.categoryName)
      if (!category) continue

      const existingTemplate = await prisma.todoTemplate.findFirst({
        where: {
          consultancyId,
          title: templateData.title,
        },
      })

      if (!existingTemplate) {
        await prisma.todoTemplate.create({
          data: {
            consultancyId,
            categoryId: category.id,
            title: templateData.title,
            description: templateData.description,
            priority: templateData.priority as any,
            estimatedDays: templateData.estimatedDays,
            isRequired: templateData.isRequired,
            dependencies: [],
            checklistItems: templateData.checklistItems,
            helpfulLinks: templateData.helpfulLinks,
            targetStage: templateData.targetStage as any,
            isActive: true,
          },
        })
      }
    }

    return NextResponse.json({
      message: "Todo categories and templates seeded successfully",
      categoriesCreated: createdCategories.length,
      templatesCreated: TODO_TEMPLATES.length,
    })
  } catch (error) {
    console.error("Error seeding todo data:", error)
    return NextResponse.json(
      { error: "Failed to seed todo data" },
      { status: 500 }
    )
  }
}
