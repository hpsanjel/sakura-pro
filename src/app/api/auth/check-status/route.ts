import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const email = searchParams.get("email")

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 })
    }

    // Find user with consultancy
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        consultancy: {
          select: {
            status: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ status: null })
    }

    return NextResponse.json({ status: user.consultancy.status })
  } catch (error) {
    console.error("Error checking consultancy status:", error)
    return NextResponse.json({ status: null })
  }
}
