import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// DELETE /api/teacher/classes/clear - Delete all teacher's classes
export async function DELETE(request: NextRequest) {
  try {
    console.log('=== CLEAR TEACHER CLASSES START ===')
    const session = await getServerSession(authOptions)
    console.log('Session:', session?.user?.id, session?.user?.role)
    
    if (!session) {
      console.log('ERROR: No session')
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only TEACHER can clear their classes
    if (session.user.role !== 'TEACHER') {
      console.log('ERROR: Not a teacher, role:', session.user.role)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get teacher record
    console.log('Looking up teacher for userId:', session.user.id)
    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
    })

    if (!teacher) {
      console.log('ERROR: Teacher profile not found for userId:', session.user.id)
      return NextResponse.json({ error: "Teacher profile not found" }, { status: 404 })
    }

    console.log('Found teacher with ID:', teacher.id)

    // Delete all classes for this teacher
    const result = await prisma.japaneseClass.deleteMany({
      where: {
        teacherId: teacher.id,
        consultancyId: session.user.consultancyId,
      },
    })

    console.log('Deleted classes count:', result.count)
    console.log('=== CLEAR TEACHER CLASSES SUCCESS ===')

    return NextResponse.json({ 
      message: `Successfully deleted ${result.count} classes`,
      deletedCount: result.count 
    })
  } catch (error) {
    console.error("=== CLEAR TEACHER CLASSES ERROR ===")
    console.error("Error clearing classes:", error)
    return NextResponse.json(
      { error: "Failed to clear classes" },
      { status: 500 }
    )
  }
}
