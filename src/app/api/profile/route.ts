import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Fetch user profile data
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const userRole = session.user.role

    let profileData: any = {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role: userRole,
      consultancyId: session.user.consultancyId
    }

    // Fetch role-specific data
    switch (userRole) {
      case 'STUDENT':
        const student = await prisma.student.findFirst({
          where: { 
            consultancyId: session.user.consultancyId,
            name: session.user.name || undefined
          },
          select: {
            phone: true,
            address: true,
            dateOfBirth: true,
            passportNumber: true,
            education: true,
            japaneseLanguageLevel: true,
            workExperience: true,
            studyGoals: true,
            preferredStudyField: true,
            createdAt: true
          }
        })
        if (student) {
          profileData = { ...profileData, ...student }
        }
        break

      case 'TEACHER':
        const teacher = await prisma.teacher.findUnique({
          where: { userId },
          select: {
            specialization: true,
            experience: true,
            qualifications: true,
            createdAt: true
          }
        })
        if (teacher) {
          profileData = { ...profileData, ...teacher }
        }
        break

      case 'COUNSELOR':
        // For counselors, we'll use the basic user info since there's no separate counselor table
        const counselor = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            createdAt: true
          }
        })
        if (counselor) {
          profileData = { ...profileData, ...counselor }
        }
        break

      case 'ADMIN':
        const admin = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            createdAt: true
          }
        })
        if (admin) {
          profileData = { ...profileData, ...admin }
        }
        break
    }

    return NextResponse.json(profileData)
  } catch (error) {
    console.error("Error fetching profile data:", error)
    return NextResponse.json(
      { error: "Failed to fetch profile data" },
      { status: 500 }
    )
  }
}

// PUT - Update user profile data
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const userRole = session.user.role
    const body = await request.json()

    // Update basic user info
    await prisma.user.update({
      where: { id: userId },
      data: {
        name: body.name
      }
    })

    // Update role-specific data
    switch (userRole) {
      case 'STUDENT':
        await prisma.student.updateMany({
          where: { 
            consultancyId: session.user.consultancyId,
            name: session.user.name || undefined
          },
          data: {
            phone: body.phone,
            address: body.address,
            education: body.education,
            workExperience: body.workExperience,
            studyGoals: body.studyGoals,
            preferredStudyField: body.preferredStudyField
          }
        })
        break

      case 'TEACHER':
        await prisma.teacher.update({
          where: { userId },
          data: {
            qualifications: body.qualifications,
            specialization: body.specialization,
            experience: body.experience
          }
        })
        break

      case 'COUNSELOR':
        // For counselors, we only update the basic user info since there's no separate counselor table
        break
    }

    return NextResponse.json({ message: "Profile updated successfully" })
  } catch (error) {
    console.error("Error updating profile data:", error)
    return NextResponse.json(
      { error: "Failed to update profile data" },
      { status: 500 }
    )
  }
}
