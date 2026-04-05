import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateInventorySchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  category: z.enum(["FURNITURE", "ELECTRONICS", "STATIONERY", "EQUIPMENT", "SUPPLIES", "MAINTENANCE", "UTILITY", "RENT", "MARKETING", "TRAINING", "TRANSPORT", "SOFTWARE", "LICENSES", "INSURANCE", "OTHER"]).optional(),
  subcategory: z.string().nullable().optional(),
  sku: z.string().nullable().optional(),
  quantity: z.number().int().min(0).optional(),
  unit: z.string().optional(),
  location: z.string().nullable().optional(),
  purchaseDate: z.string().datetime().nullable().optional(),
  purchaseCost: z.number().min(0).nullable().optional(),
  currentValue: z.number().min(0).nullable().optional(),
  condition: z.enum(["NEW", "GOOD", "FAIR", "POOR", "DAMAGED", "BROKEN"]).optional(),
  status: z.enum(["AVAILABLE", "IN_USE", "MAINTENANCE", "RETIRED", "LOST", "DISPOSED"]).optional(),
  supplier: z.string().nullable().optional(),
  warrantyExpiry: z.string().datetime().nullable().optional(),
  lastMaintenance: z.string().datetime().nullable().optional(),
  nextMaintenance: z.string().datetime().nullable().optional(),
  notes: z.string().nullable().optional(),
  imageUrl: z.string().url().nullable().optional().or(z.literal("")),
})

const transactionSchema = z.object({
  type: z.enum(["PURCHASE", "SALE", "TRANSFER", "ADJUSTMENT", "MAINTENANCE", "DISPOSAL", "RETURN", "LOAN", "USAGE"]),
  quantity: z.number().int(),
  unitCost: z.number().min(0).optional(),
  totalCost: z.number().min(0).optional(),
  reference: z.string().optional(),
  purpose: z.string().optional(),
  notes: z.string().optional(),
})

// GET - Fetch single inventory item
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

    const inventory = await prisma.inventory.findFirst({
      where: {
        id: id,
        consultancyId,
      },
      include: {
        transactions: {
          orderBy: { performedAt: "desc" },
          include: {
            // We could include user info here if needed
          },
        },
        _count: {
          select: {
            transactions: true,
          },
        },
      },
    })

    if (!inventory) {
      return NextResponse.json({ error: "Inventory item not found" }, { status: 404 })
    }

    return NextResponse.json(inventory)
  } catch (error) {
    console.error("Error fetching inventory item:", error)
    return NextResponse.json(
      { error: "Failed to fetch inventory item" },
      { status: 500 }
    )
  }
}

// PUT - Update inventory item
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

    // Only ADMIN and COUNSELOR can update inventory items
    if (session.user.role !== 'ADMIN' && session.user.role !== 'COUNSELOR') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const consultancyId = session.user.consultancyId
    if (!consultancyId) {
      return NextResponse.json({ error: "Consultancy ID not found" }, { status: 400 })
    }

    const body = await request.json()
    const validatedData = updateInventorySchema.parse(body)

    // Check if inventory item exists and belongs to consultancy
    const existingItem = await prisma.inventory.findFirst({
      where: {
        id: id,
        consultancyId,
      },
    })

    if (!existingItem) {
      return NextResponse.json({ error: "Inventory item not found" }, { status: 404 })
    }

    // Check if SKU already exists (if provided and different from current)
    if (validatedData.sku && validatedData.sku !== existingItem.sku) {
      const skuExists = await prisma.inventory.findFirst({
        where: {
          sku: validatedData.sku,
          consultancyId,
          id: { not: (await params).id },
        },
      })

      if (skuExists) {
        return NextResponse.json(
          { error: "SKU already exists" },
          { status: 400 }
        )
      }
    }

    // Update inventory item
    const inventory = await prisma.inventory.update({
      where: { id: id },
      data: {
        ...validatedData,
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

    return NextResponse.json(inventory)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      )
    }

    console.error("Error updating inventory item:", error)
    return NextResponse.json(
      { error: "Failed to update inventory item" },
      { status: 500 }
    )
  }
}

// DELETE - Delete inventory item
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

    // Only ADMIN can delete inventory items
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const consultancyId = session.user.consultancyId
    if (!consultancyId) {
      return NextResponse.json({ error: "Consultancy ID not found" }, { status: 400 })
    }

    // Check if inventory item exists and belongs to consultancy
    const existingItem = await prisma.inventory.findFirst({
      where: {
        id: id,
        consultancyId,
      },
      include: {
        _count: {
          select: {
            transactions: true,
          },
        },
      },
    })

    if (!existingItem) {
      return NextResponse.json({ error: "Inventory item not found" }, { status: 404 })
    }

    // Check if item has transactions (prevent deletion if it has history)
    if (existingItem._count.transactions > 0) {
      return NextResponse.json(
        { error: "Cannot delete inventory item with transaction history. Consider retiring it instead." },
        { status: 400 }
      )
    }

    // Delete inventory item (cascade will handle related records)
    await prisma.inventory.delete({
      where: { id: id },
    })

    return NextResponse.json({ message: "Inventory item deleted successfully" })
  } catch (error) {
    console.error("Error deleting inventory item:", error)
    return NextResponse.json(
      { error: "Failed to delete inventory item" },
      { status: 500 }
    )
  }
}

// POST - Add transaction to inventory item
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

    // Only ADMIN and COUNSELOR can add transactions
    if (session.user.role !== 'ADMIN' && session.user.role !== 'COUNSELOR') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const consultancyId = session.user.consultancyId
    if (!consultancyId) {
      return NextResponse.json({ error: "Consultancy ID not found" }, { status: 400 })
    }

    // Check if inventory item exists and belongs to consultancy
    const existingItem = await prisma.inventory.findFirst({
      where: {
        id: id,
        consultancyId,
      },
    })

    if (!existingItem) {
      return NextResponse.json({ error: "Inventory item not found" }, { status: 404 })
    }

    const body = await request.json()
    const validatedData = transactionSchema.parse(body)

    // Create transaction
    const transaction = await prisma.inventoryTransaction.create({
      data: {
        inventoryId: id,
        consultancyId,
        ...validatedData,
        performedBy: session.user.id,
      },
    })

    // Update inventory quantity based on transaction type
    let quantityChange = 0
    switch (validatedData.type) {
      case "PURCHASE":
      case "RETURN":
      case "ADJUSTMENT":
        quantityChange = Math.abs(validatedData.quantity)
        break
      case "SALE":
      case "DISPOSAL":
      case "USAGE":
        quantityChange = -Math.abs(validatedData.quantity)
        break
      case "TRANSFER":
      case "LOAN":
      case "MAINTENANCE":
        // These don't change quantity, just status
        quantityChange = 0
        break
    }

    if (quantityChange !== 0) {
      await prisma.inventory.update({
        where: { id: id },
        data: {
          quantity: {
            increment: quantityChange,
          },
        },
      })
    }

    return NextResponse.json(transaction, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      )
    }

    console.error("Error creating transaction:", error)
    return NextResponse.json(
      { error: "Failed to create transaction" },
      { status: 500 }
    )
  }
}
