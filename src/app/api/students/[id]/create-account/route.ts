import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sendStudentWelcomeEmail } from "@/lib/email"
import { generateSetupToken } from "@/lib/tokens"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params
    const body = await request.json()

    if (!session || !['ADMIN', 'COUNSELOR'].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get student
    const student = await prisma.student.findFirst({
      where: {
        id,
        consultancyId: session.user.consultancyId
      }
    })

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    if (!student.email) {
      return NextResponse.json({ error: "Student email is required" }, { status: 400 })
    }

    if (student.userId) {
      return NextResponse.json({ error: "Student already has an account" }, { status: 400 })
    }

    const consultancyId = session.user.consultancyId
    if (!consultancyId) {
      return NextResponse.json({ error: "Consultancy ID not found in session" }, { status: 400 })
    }

    // Create user account with no password yet; the student sets one via the setup-password link
    const user = await prisma.user.create({
      data: {
        email: student.email,
        name: student.name,
        password: null,
        role: 'STUDENT',
        consultancyId,
      }
    })

    // Link student to user and automatically update visa status to DOCS_PENDING
    const updatedStudent = await prisma.student.update({
      where: { id: student.id },
      data: {
        userId: user.id,
        hasLoginAccess: true,
        loginSentAt: new Date(),
        // Automatically update visa status when student gets login access
        visaStatus: student.visaStatus === 'NEW_LEAD' ? 'DOCS_PENDING' : student.visaStatus,
      }
    })

    // Log the automatic visa status change for audit purposes
    if (student.visaStatus === 'NEW_LEAD') {
      console.log(`Student ${student.name} (${student.id}) visa status automatically updated from NEW_LEAD to DOCS_PENDING when login account was created`)
    }

    // Generate a persisted setup token for the password-setup link
    const setupToken = await generateSetupToken(user.id, student.email, 'STUDENT', consultancyId)

    // Create default documents for the student - matching frontend REQUIRED_DOCUMENT_TYPES
    const documentTypes = [
      "Passport",
      "Academic Transcripts",
      "Bank Statement",
      "Sponsorship Documents",
      "Statement of Purpose (SOP)",
      "Birth Certificate",
      "Police Clearance Certificate",
      "Medical Certificate",
      "Photographs (Passport Size)",
      "Language Proficiency Certificate"
    ]

    await prisma.document.createMany({
      data: documentTypes.map(type => ({
        studentId: student.id,
        type,
        status: "MISSING"
      }))
    })

    // Send welcome email with setup link
    const setupLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/setup-password?token=${setupToken}&email=${encodeURIComponent(student.email)}`
    
    try {
      // Get consultancy details for personalized email
      const consultancy = await prisma.consultancy.findUnique({
        where: { id: session.user.consultancyId }
      })

      await sendStudentWelcomeEmail(student.email, student.name, setupLink, consultancy ? {
        name: consultancy.name,
        email: consultancy.email,
        phone: consultancy.phone || undefined,
        address: consultancy.address || undefined,
      } : undefined)
      console.log("Welcome email sent successfully to:", student.email)
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError)
      // Continue even if email fails - account is still created
    }

    return NextResponse.json({
      message: "Student account created successfully",
      studentEmail: student.email,
      emailSent: true,
      setupLink, // For development/testing
      visaStatusUpdated: updatedStudent.visaStatus,
      previousVisaStatus: student.visaStatus,
      automaticStatusChange: student.visaStatus === 'NEW_LEAD'
    })

  } catch (error) {
    console.error("Error creating student account:", error)
    return NextResponse.json(
      { error: "Failed to create student account" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params

    if (!session || !['ADMIN', 'COUNSELOR'].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get student
    const student = await prisma.student.findFirst({
      where: {
        id,
        consultancyId: session.user.consultancyId
      }
    })

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    if (!student.userId) {
      return NextResponse.json({ error: "Student does not have an account" }, { status: 400 })
    }

    // Delete user account
    await prisma.user.delete({
      where: { id: student.userId }
    })

    // Update student record
    await prisma.student.update({
      where: { id: student.id },
      data: {
        userId: null,
        hasLoginAccess: false,
        loginSentAt: null,
      }
    })

    return NextResponse.json({
      message: "Student account revoked successfully"
    })

  } catch (error) {
    console.error("Error revoking student account:", error)
    return NextResponse.json(
      { error: "Failed to revoke student account" },
      { status: 500 }
    )
  }
}
