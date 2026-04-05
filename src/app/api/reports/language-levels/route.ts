import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Fetch language level distribution
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only ADMIN can view reports
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const consultancyId = session.user.consultancyId

    // Get language level counts
    const languageLevelCounts = await prisma.student.groupBy({
      by: ['japaneseLanguageLevel'],
      where: { consultancyId },
      _count: {
        japaneseLanguageLevel: true
      }
    })

    const languageLevelData = languageLevelCounts.map(item => ({
      level: item.japaneseLanguageLevel,
      count: item._count.japaneseLanguageLevel
    }))

    // Sort by level (N1 to N5)
    const levelOrder = { 'N1': 0, 'N2': 1, 'N3': 2, 'N4': 3, 'N5': 4 }
    languageLevelData.sort((a, b) => (levelOrder[a.level as keyof typeof levelOrder] || 999) - (levelOrder[b.level as keyof typeof levelOrder] || 999))

    return NextResponse.json(languageLevelData)
  } catch (error) {
    console.error("Error fetching language level data:", error)
    return NextResponse.json(
      { error: "Failed to fetch language level data" },
      { status: 500 }
    )
  }
}
