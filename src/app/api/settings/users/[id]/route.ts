import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// DELETE - Delete a user
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

    // Only ADMIN can delete users
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const consultancyId = session.user.consultancyId

    // Check if user exists and belongs to the same consultancy
    const user = await prisma.user.findFirst({
      where: {
        id,
        consultancyId
      }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Prevent deletion of SUPERADMIN and self
    if (user.role === "SUPERADMIN") {
      return NextResponse.json({ error: "Cannot delete SUPERADMIN user" }, { status: 403 })
    }

    if (user.id === session.user.id) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 403 })
    }

    // Delete the user
    await prisma.user.delete({
      where: { id }
    })

    return NextResponse.json({ message: "User deleted successfully" })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    )
  }
}
