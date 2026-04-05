import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const employeeStatusEnum = ["APPLICANT", "SCREENING", "INTERVIEW", "OFFERED", "HIRED", "PROBATION", "ACTIVE", "ON_LEAVE", "TERMINATED"] as const
const employmentTypeEnum = ["FULL_TIME", "PART_TIME", "CONTRACT", "FREELANCE"] as const
const employeeCategoryEnum = ["ADMINISTRATION", "MARKETING", "LANGUAGE", "COUNSELORS", "IT", "FINANCE", "HR", "OPERATIONS", "MANAGEMENT", "OTHER"] as const
const userRoleEnum = ["SUPERADMIN", "ADMIN", "COUNSELOR", "TEACHER", "STUDENT", "EMPLOYEE"] as const

const updateEmployeeSchema = z.object({
  firstName: z.string().min(1, "First name is required").optional(),
  lastName: z.string().min(1, "Last name is required").optional(),
  email: z.string().email("Invalid email address").optional(),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
  designation: z.string().min(1, "Designation is required").optional(),
  department: z.string().optional(),
  category: z.enum(employeeCategoryEnum).optional(),
  role: z.enum(userRoleEnum).optional(),
  experience: z.string().optional(),
  qualifications: z.string().optional(),
  skills: z.string().optional(),
  previousCompanies: z.string().optional(),
  employmentType: z.enum(employmentTypeEnum).optional(),
  salary: z.number().min(0).optional(),
  currency: z.string().optional(),
  status: z.enum(employeeStatusEnum).optional(),
  hireDate: z.string().datetime().optional(),
  employeeId: z.string().optional(),
})

// GET - Fetch a single employee by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 })
    }

    const { id: employeeId } = await params

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
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

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 })
    }

    if (employee.consultancyId !== session.user.consultancyId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const transformedEmployee = {
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
    }

    return NextResponse.json(transformedEmployee)
  } catch (error) {
    console.error("Error fetching employee:", error)
    return NextResponse.json(
      { error: "Failed to fetch employee" },
      { status: 500 }
    )
  }
}

// PUT - Update an employee
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 })
    }

    const { id: employeeId } = await params

    // Verify employee exists and belongs to the same consultancy
    const existingEmployee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        user: true,
      },
    })

    if (!existingEmployee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 })
    }

    if (existingEmployee.consultancyId !== session.user.consultancyId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    
    const validation = updateEmployeeSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.issues },
        { status: 400 }
      )
    }

    const updateData = validation.data

    // If email is being updated, check if it's already taken by another user
    if (updateData.email && updateData.email !== existingEmployee.user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: updateData.email },
      })

      if (existingUser) {
        return NextResponse.json(
          { error: "Email already exists" },
          { status: 409 }
        )
      }
    }

    // Update user and employee data
    const updatedEmployee = await prisma.employee.update({
      where: { id: employeeId },
      data: {
        ...updateData,
        hireDate: updateData.hireDate ? new Date(updateData.hireDate) : undefined,
        user: updateData.email || updateData.role ? {
          update: {
            ...(updateData.email && { email: updateData.email }),
            ...(updateData.firstName && updateData.lastName && { 
              name: `${updateData.firstName} ${updateData.lastName}` 
            }),
            ...(updateData.role && { role: updateData.role }),
          },
        } : undefined,
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

    const transformedEmployee = {
      id: updatedEmployee.id,
      userId: updatedEmployee.userId,
      firstName: updatedEmployee.firstName,
      lastName: updatedEmployee.lastName,
      email: updatedEmployee.user.email,
      phoneNumber: updatedEmployee.phoneNumber,
      address: updatedEmployee.address,
      designation: updatedEmployee.designation,
      department: updatedEmployee.department,
      category: updatedEmployee.category,
      experience: updatedEmployee.experience,
      qualifications: updatedEmployee.qualifications,
      skills: updatedEmployee.skills,
      previousCompanies: updatedEmployee.previousCompanies,
      status: updatedEmployee.status,
      employmentType: updatedEmployee.employmentType,
      salary: updatedEmployee.salary,
      currency: updatedEmployee.currency,
      hireDate: updatedEmployee.hireDate?.toISOString(),
      employeeId: updatedEmployee.employeeId,
      createdAt: updatedEmployee.createdAt.toISOString(),
      user: updatedEmployee.user,
      _count: {
        documents: 0,
        payslips: 0,
      },
    }

    return NextResponse.json(transformedEmployee)
  } catch (error) {
    console.error("Error updating employee:", error)
    return NextResponse.json(
      { error: "Failed to update employee" },
      { status: 500 }
    )
  }
}

// DELETE - Delete an employee
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 })
    }

    const { id: employeeId } = await params

    // Verify employee exists and belongs to the same consultancy
    const existingEmployee = await prisma.employee.findUnique({
      where: { id: employeeId },
    })

    if (!existingEmployee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 })
    }

    if (existingEmployee.consultancyId !== session.user.consultancyId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Delete the employee (this will also delete the associated user due to cascade)
    await prisma.employee.delete({
      where: { id: employeeId },
    })

    return NextResponse.json({ message: "Employee deleted successfully" })
  } catch (error) {
    console.error("Error deleting employee:", error)
    return NextResponse.json(
      { error: "Failed to delete employee" },
      { status: 500 }
    )
  }
}
