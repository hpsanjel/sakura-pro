import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"

const employeeStatusEnum = ["APPLICANT", "SCREENING", "INTERVIEW", "OFFERED", "HIRED", "PROBATION", "ACTIVE", "ON_LEAVE", "TERMINATED"] as const
const employmentTypeEnum = ["FULL_TIME", "PART_TIME", "CONTRACT", "FREELANCE"] as const
const employeeCategoryEnum = ["ADMINISTRATION", "MARKETING", "LANGUAGE", "COUNSELORS", "IT", "FINANCE", "HR", "OPERATIONS", "MANAGEMENT", "OTHER"] as const
const userRoleEnum = ["SUPERADMIN", "ADMIN", "COUNSELOR", "TEACHER", "STUDENT", "EMPLOYEE"] as const

const createEmployeeSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
  designation: z.string().min(1, "Designation is required"),
  department: z.string().optional(),
  category: z.enum(employeeCategoryEnum).default("OTHER"),
  role: z.enum(userRoleEnum).default("EMPLOYEE"),
  experience: z.string().optional(),
  qualifications: z.string().optional(),
  skills: z.string().optional(),
  previousCompanies: z.string().optional(),
  employmentType: z.enum(employmentTypeEnum).default("FULL_TIME"),
  salary: z.number().min(0).optional(),
  currency: z.string().default("USD"),
  status: z.enum(employeeStatusEnum).default("APPLICANT"),
  hireDate: z.string().datetime().optional(),
  employeeId: z.string().optional(),
})

// GET - Fetch all employees with their details
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

    const employees = await prisma.employee.findMany({
      where: {
        consultancyId: consultancyId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    // Transform the data to match the frontend interface
    const transformedEmployees = employees.map(employee => ({
      id: employee.id,
      userId: employee.userId,
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.user.email,
      phoneNumber: employee.phoneNumber,
      address: employee.address,
      designation: employee.designation,
      department: employee.department,
      category: employee.category,
      experience: employee.experience,
      qualifications: employee.qualifications,
      skills: employee.skills,
      previousCompanies: employee.previousCompanies,
      status: employee.status,
      employmentType: employee.employmentType,
      salary: employee.salary,
      currency: employee.currency,
      hireDate: employee.hireDate?.toISOString(),
      employeeId: employee.employeeId,
      createdAt: employee.createdAt.toISOString(),
      user: employee.user,
      _count: {
        documents: 0,
        payslips: 0,
      },
    }))

    return NextResponse.json(transformedEmployees)
  } catch (error) {
    console.error("Error fetching employees:", error)
    return NextResponse.json(
      { error: "Failed to fetch employees" },
      { status: 500 }
    )
  }
}

// POST - Create a new employee (and user account)
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
    
    const validation = createEmployeeSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.issues },
        { status: 400 }
      )
    }

    const { 
      firstName, 
      lastName, 
      email, 
      phoneNumber, 
      address, 
      designation, 
      department, 
      category,
      role,
      experience, 
      qualifications, 
      skills, 
      previousCompanies, 
      employmentType, 
      salary, 
      currency, 
      status, 
      hireDate, 
      employeeId 
    } = validation.data

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
        role: role,
        consultancyId,
      },
    })

    try {
      // Create employee profile
      const newEmployee = await prisma.employee.create({
        data: {
          userId: newUser.id,
          consultancyId,
          firstName,
          lastName,
          phoneNumber,
          address,
          designation,
          department,
          category,
          experience,
          qualifications,
          skills,
          previousCompanies,
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
              role: true,
            },
          },
        },
      })

      // TODO: Send email with login credentials
      // await sendEmployeeWelcomeEmail(email, tempPassword, firstName)

      const transformedEmployee = {
        id: newEmployee.id,
        userId: newEmployee.userId,
        firstName: newEmployee.firstName,
        lastName: newEmployee.lastName,
        email: newEmployee.user.email,
        phoneNumber: newEmployee.phoneNumber,
        address: newEmployee.address,
        designation: newEmployee.designation,
        department: newEmployee.department,
        category: newEmployee.category,
        experience: newEmployee.experience,
        qualifications: newEmployee.qualifications,
        skills: newEmployee.skills,
        previousCompanies: newEmployee.previousCompanies,
        status: newEmployee.status,
        employmentType: newEmployee.employmentType,
        salary: newEmployee.salary,
        currency: newEmployee.currency,
        hireDate: newEmployee.hireDate?.toISOString(),
        employeeId: newEmployee.employeeId,
        createdAt: newEmployee.createdAt.toISOString(),
        user: newEmployee.user,
        _count: {
          documents: 0,
          payslips: 0,
        },
      }

      return NextResponse.json(transformedEmployee, { status: 201 })
    } catch (employeeError) {
      console.error("Error creating employee profile:", employeeError)
      // Delete the user since employee profile creation failed
      await prisma.user.delete({
        where: { id: newUser.id }
      })
      return NextResponse.json(
        { error: "Failed to create employee profile" },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Error creating employee:", error)
    return NextResponse.json(
      { error: "Failed to create employee" },
      { status: 500 }
    )
  }
}
