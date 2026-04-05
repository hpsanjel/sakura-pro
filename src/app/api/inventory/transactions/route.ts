import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// GET - Fetch inventory transactions
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
    const inventoryId = searchParams.get("inventoryId")
    const type = searchParams.get("type")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "50")

    // Build filter conditions
    const where: any = { consultancyId }
    
    if (inventoryId) {
      where.inventoryId = inventoryId
    }
    
    if (type && type !== "ALL") {
      where.type = type
    }

    // Get transactions with pagination
    const [transactions, total] = await Promise.all([
      prisma.inventoryTransaction.findMany({
        where,
        orderBy: { performedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          inventory: {
            select: {
              id: true,
              name: true,
              sku: true,
              category: true,
            },
          },
        },
      }),
      prisma.inventoryTransaction.count({ where }),
    ])

    return NextResponse.json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching transactions:", error)
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    )
  }
}
