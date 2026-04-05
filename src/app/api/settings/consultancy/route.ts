import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Fetch consultancy settings
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only ADMIN can view settings
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const consultancyId = session.user.consultancyId

    const consultancy = await prisma.consultancy.findUnique({
      where: { id: consultancyId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true
      }
    })

    if (!consultancy) {
      return NextResponse.json({ error: "Consultancy not found" }, { status: 404 })
    }

    return NextResponse.json(consultancy)
  } catch (error) {
    console.error("Error fetching consultancy settings:", error)
    return NextResponse.json(
      { error: "Failed to fetch consultancy settings" },
      { status: 500 }
    )
  }
}

// PUT - Update consultancy settings
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only ADMIN can update settings
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const consultancyId = session.user.consultancyId
    const body = await request.json()

    const consultancy = await prisma.consultancy.update({
      where: { id: consultancyId },
      data: {
        name: body.name,
        email: body.email,
        phone: body.phone,
        address: body.address
      }
    })

    return NextResponse.json(consultancy)
  } catch (error) {
    console.error("Error updating consultancy settings:", error)
    return NextResponse.json(
      { error: "Failed to update consultancy settings" },
      { status: 500 }
    )
  }
}
