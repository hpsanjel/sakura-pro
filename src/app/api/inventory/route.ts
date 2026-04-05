import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Validation schemas
const createInventorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().nullable(),
  category: z.enum(["FURNITURE", "ELECTRONICS", "STATIONERY", "EQUIPMENT", "SUPPLIES", "MAINTENANCE", "UTILITY", "RENT", "MARKETING", "TRAINING", "TRANSPORT", "SOFTWARE", "LICENSES", "INSURANCE", "OTHER"]),
  subcategory: z.string().optional().nullable(),
  sku: z.string().optional().nullable(),
  quantity: z.number().int().min(0, "Quantity must be non-negative"),
  unit: z.string().default("pcs"),
  location: z.string().optional().nullable(),
  purchaseDate: z.string().datetime().optional().nullable(),
  purchaseCost: z.number().min(0, "Purchase cost must be non-negative").optional().nullable(),
  currentValue: z.number().min(0, "Current value must be non-negative").optional().nullable(),
  condition: z.enum(["NEW", "GOOD", "FAIR", "POOR", "DAMAGED", "BROKEN"]).default("NEW"),
  status: z.enum(["AVAILABLE", "IN_USE", "MAINTENANCE", "RETIRED", "LOST", "DISPOSED"]).default("AVAILABLE"),
  supplier: z.string().optional().nullable(),
  warrantyExpiry: z.string().datetime().optional().nullable(),
  lastMaintenance: z.string().datetime().optional().nullable(),
  nextMaintenance: z.string().datetime().optional().nullable(),
  notes: z.string().optional().nullable(),
  imageUrl: z.string().url().optional().nullable().or(z.literal("")),
})

const updateInventorySchema = createInventorySchema.partial()

const transactionSchema = z.object({
  type: z.enum(["PURCHASE", "SALE", "TRANSFER", "ADJUSTMENT", "MAINTENANCE", "DISPOSAL", "RETURN", "LOAN", "USAGE"]),
  quantity: z.number().int(),
  unitCost: z.number().min(0).optional(),
  totalCost: z.number().min(0).optional(),
  reference: z.string().optional(),
  purpose: z.string().optional(),
  notes: z.string().optional(),
})

// GET - Fetch inventory items
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

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const status = searchParams.get("status")
    const search = searchParams.get("search")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "50")

    // Build filter conditions
    const where: any = { consultancyId }
    
    if (category && category !== "ALL") {
      where.category = category
    }
    
    if (status && status !== "ALL") {
      where.status = status
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } },
        { supplier: { contains: search, mode: "insensitive" } },
      ]
    }

    // Get inventory items with pagination
    const [inventory, total] = await Promise.all([
      prisma.inventory.findMany({
        where,
        orderBy: [
          { category: "asc" },
          { name: "asc" },
        ],
        skip: (page - 1) * limit,
        take: limit,
        include: {
          transactions: {
            orderBy: { performedAt: "desc" },
            take: 5,
            select: {
              id: true,
              type: true,
              quantity: true,
              totalCost: true,
              performedAt: true,
              purpose: true,
            },
          },
          _count: {
            select: {
              transactions: true,
            },
          },
        },
      }),
      prisma.inventory.count({ where }),
    ])

    // Calculate summary statistics with proper total values
    const summary = await prisma.inventory.groupBy({
      by: ["category", "status"],
      where: { consultancyId },
      _sum: {
        quantity: true,
        purchaseCost: true,
        currentValue: true,
      },
      _count: {
        id: true,
      },
    })

    // Calculate actual total values (considering quantity)
    const itemsForCalculation = await prisma.inventory.findMany({
      where: { consultancyId },
      select: {
        category: true,
        status: true,
        quantity: true,
        purchaseCost: true,
        currentValue: true,
      },
    })

    // Group by category and status, then calculate actual totals
    const actualSummary = itemsForCalculation.reduce((acc: any, item) => {
      const key = `${item.category}_${item.status}`
      if (!acc[key]) {
        acc[key] = {
          category: item.category,
          status: item.status,
          _sum: {
            quantity: 0,
            purchaseCost: 0,
            currentValue: 0,
          },
          _count: {
            id: 0,
          },
        }
      }
      
      acc[key]._sum.quantity += item.quantity || 0
      acc[key]._sum.purchaseCost += (item.purchaseCost || 0) * (item.quantity || 0)
      acc[key]._sum.currentValue += (item.currentValue || 0) * (item.quantity || 0)
      acc[key]._count.id += 1
      
      return acc
    }, {})

    const enhancedSummary = Object.values(actualSummary)

    return NextResponse.json({
      inventory,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      summary: enhancedSummary,
    })
  } catch (error) {
    console.error("Error fetching inventory:", error)
    return NextResponse.json(
      { error: "Failed to fetch inventory" },
      { status: 500 }
    )
  }
}

// POST - Create new inventory item
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only ADMIN and COUNSELOR can create inventory items
    if (session.user.role !== 'ADMIN' && session.user.role !== 'COUNSELOR') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const consultancyId = session.user.consultancyId
    if (!consultancyId) {
      return NextResponse.json({ error: "Consultancy ID not found" }, { status: 400 })
    }

    const body = await request.json()
    const validatedData = createInventorySchema.parse(body)

    // Check if SKU already exists (if provided)
    if (validatedData.sku) {
      const existingItem = await prisma.inventory.findFirst({
        where: {
          sku: validatedData.sku,
          consultancyId,
        },
      })

      if (existingItem) {
        return NextResponse.json(
          { error: "SKU already exists" },
          { status: 400 }
        )
      }
    }

    // Create inventory item
    const inventory = await prisma.inventory.create({
      data: {
        ...validatedData,
        consultancyId,
        purchaseDate: validatedData.purchaseDate ? new Date(validatedData.purchaseDate) : null,
        warrantyExpiry: validatedData.warrantyExpiry ? new Date(validatedData.warrantyExpiry) : null,
        lastMaintenance: validatedData.lastMaintenance ? new Date(validatedData.lastMaintenance) : null,
        nextMaintenance: validatedData.nextMaintenance ? new Date(validatedData.nextMaintenance) : null,
      },
      include: {
        transactions: {
          orderBy: { performedAt: "desc" },
          take: 5,
        },
        _count: {
          select: {
            transactions: true,
          },
        },
      },
    })

    // Create initial transaction if it's a purchase
    if (validatedData.purchaseCost && validatedData.quantity > 0) {
      await prisma.inventoryTransaction.create({
        data: {
          inventoryId: inventory.id,
          consultancyId,
          type: "PURCHASE",
          quantity: validatedData.quantity,
          unitCost: validatedData.purchaseCost / validatedData.quantity,
          totalCost: validatedData.purchaseCost,
          performedBy: session.user.id,
          purpose: "Initial purchase",
        },
      })
    }

    return NextResponse.json(inventory, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      )
    }

    console.error("Error creating inventory:", error)
    return NextResponse.json(
      { error: "Failed to create inventory item" },
      { status: 500 }
    )
  }
}
