import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Validation schema for updating a school
const updateSchoolSchema = z.object({
  name: z.string().min(1, "School name is required").optional(),
  address: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
})

// GET - Fetch a single school
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only ADMIN and COUNSELOR can view schools
    if (session.user.role !== "ADMIN" && session.user.role !== "COUNSELOR") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const school = await prisma.school.findFirst({
      where: {
        id: id,
        consultancyId: session.user.consultancyId,
      },
      include: {
        _count: {
          select: {
            applications: true,
          },
        },
        applications: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                passportNumber: true,
                visaStatus: true,
              },
            },
          },
          orderBy: {
            appliedAt: "desc",
          },
        },
      },
    })

    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 })
    }

    return NextResponse.json(school)
  } catch (error) {
    console.error("Error fetching school:", error)
    return NextResponse.json(
      { error: "Failed to fetch school" },
      { status: 500 }
    )
  }
}

// PUT - Update a school
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only ADMIN can update schools
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = updateSchoolSchema.parse(body)

    // Verify school belongs to the user's consultancy
    const existingSchool = await prisma.school.findFirst({
      where: {
        id: id,
        consultancyId: session.user.consultancyId,
      },
    })

    if (!existingSchool) {
      return NextResponse.json({ error: "School not found" }, { status: 404 })
    }

    // Check if another school with the same name exists
    if (validatedData.name && validatedData.name !== existingSchool.name) {
      const duplicateSchool = await prisma.school.findFirst({
        where: {
          name: validatedData.name,
          consultancyId: session.user.consultancyId,
          id: { not: id },
        },
      })

      if (duplicateSchool) {
        return NextResponse.json(
          { error: "A school with this name already exists" },
          { status: 400 }
        )
      }
    }

    // Update the school
    const school = await prisma.school.update({
      where: { id: id },
      data: {
        ...(validatedData.name && { name: validatedData.name }),
        ...(validatedData.address !== undefined && { address: validatedData.address || null }),
        ...(validatedData.website !== undefined && { website: validatedData.website || null }),
      },
      include: {
        _count: {
          select: {
            applications: true,
          },
        },
      },
    })

    return NextResponse.json(school)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      )
    }

    console.error("Error updating school:", error)
    return NextResponse.json(
      { error: "Failed to update school" },
      { status: 500 }
    )
  }
}

// DELETE - Delete a school
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only ADMIN can delete schools
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Verify school belongs to the user's consultancy
    const existingSchool = await prisma.school.findFirst({
      where: {
        id: id,
        consultancyId: session.user.consultancyId,
      },
      include: {
        _count: {
          select: {
            applications: true,
          },
        },
      },
    })

    if (!existingSchool) {
      return NextResponse.json({ error: "School not found" }, { status: 404 })
    }

    // Check if school has applications
    if (existingSchool._count.applications > 0) {
      return NextResponse.json(
        { error: "Cannot delete school with existing applications" },
        { status: 400 }
      )
    }

    // Delete the school
    await prisma.school.delete({
      where: { id: id },
    })

    return NextResponse.json({ message: "School deleted successfully" })
  } catch (error) {
    console.error("Error deleting school:", error)
    return NextResponse.json(
      { error: "Failed to delete school" },
      { status: 500 }
    )
  }
}
