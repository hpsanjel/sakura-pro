import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"

const teacherStatusEnum = ["APPLICANT", "SCREENING", "INTERVIEW", "OFFERED", "HIRED", "PROBATION", "ACTIVE", "ON_LEAVE", "TERMINATED"] as const
const employmentTypeEnum = ["FULL_TIME", "PART_TIME", "CONTRACT", "FREELANCE"] as const

const createTeacherSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
  specialization: z.string().optional(),
  experience: z.string().optional(),
  qualifications: z.string().optional(),
  employmentType: z.enum(employmentTypeEnum).default("FULL_TIME"),
  salary: z.number().min(0).optional(),
  currency: z.string().default("USD"),
  status: z.enum(teacherStatusEnum).default("APPLICANT"),
  hireDate: z.string().datetime().optional(),
  employeeId: z.string().optional(),
})

// GET - Fetch all teachers with their details
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 })
    }

    const consultancyId = session.user.consultancyId
    if (!consultancyId) {
      return NextResponse.json({ error: "Consultancy ID not found" }, { status: 400 })
    }

    const teachers = await prisma.teacher.findMany({
      where: {
        consultancyId: consultancyId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    // Transform the data to match the frontend interface
    const transformedTeachers = teachers.map(teacher => ({
      id: teacher.id,
      userId: teacher.userId,
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      email: teacher.user.email,
      phoneNumber: teacher.phoneNumber,
      address: teacher.address,
      specialization: teacher.specialization,
      experience: teacher.experience,
      qualifications: teacher.qualifications,
      status: teacher.status,
      employmentType: teacher.employmentType,
      salary: teacher.salary,
      currency: teacher.currency,
      hireDate: teacher.hireDate?.toISOString(),
      employeeId: teacher.employeeId,
      createdAt: teacher.createdAt.toISOString(),
      user: teacher.user,
      _count: {
        documents: 0,
        payslips: 0,
      },
    }))

    return NextResponse.json(transformedTeachers)
  } catch (error) {
    console.error("Error fetching teachers:", error)
    return NextResponse.json(
      { error: "Failed to fetch teachers" },
      { status: 500 }
    )
  }
}

// POST - Create a new teacher (and user account)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 })
    }

    const consultancyId = session.user.consultancyId
    if (!consultancyId) {
      return NextResponse.json({ error: "Consultancy ID not found" }, { status: 400 })
    }

    const body = await request.json()
    
    const validation = createTeacherSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.issues },
        { status: 400 }
      )
    }

    const { firstName, lastName, email, phoneNumber, address, specialization, experience, qualifications, employmentType, salary, currency, status, hireDate, employeeId } = validation.data

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      )
    }

    // Generate a temporary password
    const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8)
    const hashedPassword = await bcrypt.hash(tempPassword, 10)

    // Create user account first
    const newUser = await prisma.user.create({
      data: {
        email,
        name: `${firstName} ${lastName}`,
        password: hashedPassword,
        role: "TEACHER",
        consultancyId,
      },
    })

    try {
      // Create teacher profile
      const newTeacher = await prisma.teacher.create({
        data: {
          userId: newUser.id,
          consultancyId,
          firstName,
          lastName,
          phoneNumber,
          address,
          specialization,
          experience,
          qualifications,
          employmentType,
          salary,
          currency,
          status,
          hireDate: hireDate ? new Date(hireDate) : null,
          employeeId,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      })

      // TODO: Send email with login credentials
      // await sendTeacherWelcomeEmail(email, tempPassword, firstName)

      const transformedTeacher = {
        id: newTeacher.id,
        userId: newTeacher.userId,
        firstName: newTeacher.firstName,
        lastName: newTeacher.lastName,
        email: newTeacher.user.email,
        phoneNumber: newTeacher.phoneNumber,
        address: newTeacher.address,
        specialization: newTeacher.specialization,
        experience: newTeacher.experience,
        qualifications: newTeacher.qualifications,
        status: newTeacher.status,
        employmentType: newTeacher.employmentType,
        salary: newTeacher.salary,
        currency: newTeacher.currency,
        hireDate: newTeacher.hireDate?.toISOString(),
        employeeId: newTeacher.employeeId,
        createdAt: newTeacher.createdAt.toISOString(),
        user: newTeacher.user,
        _count: {
          documents: 0,
          payslips: 0,
        },
      }

      return NextResponse.json(transformedTeacher, { status: 201 })
    } catch (teacherError) {
      console.error("Error creating teacher profile:", teacherError)
      // Delete the user since teacher profile creation failed
      await prisma.user.delete({
        where: { id: newUser.id }
      })
      return NextResponse.json(
        { error: "Failed to create teacher profile" },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Error creating teacher:", error)
    return NextResponse.json(
      { error: "Failed to create teacher" },
      { status: 500 }
    )
  }
}
