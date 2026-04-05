import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// GET - Fetch all payslips for an employee
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

    // Verify employee exists and belongs to the same consultancy
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
    })

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 })
    }

    if (employee.consultancyId !== session.user.consultancyId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // For now, store payslips in memory (in production, use a database table)
    // This is a temporary solution to demonstrate the functionality
    const storedPayslips = (global as any).employeePayslips || {}
    const employeePayslips = storedPayslips[employeeId] || []
    
    return NextResponse.json(employeePayslips)
  } catch (error) {
    console.error("Error fetching employee payslips:", error)
    return NextResponse.json(
      { error: "Failed to fetch payslips" },
      { status: 500 }
    )
  }
}

// POST - Generate a new payslip
export async function POST(
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
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
    })

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 })
    }

    if (employee.consultancyId !== session.user.consultancyId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const {
      payPeriod,
      basicSalary,
      housingAllow,
      transportAllow,
      mealAllow,
      otherAllow,
      taxDeduction,
      insuranceDed,
      otherDed,
      currency,
      sendEmail,
    } = body

    // Validate required fields
    if (!payPeriod || basicSalary === undefined) {
      return NextResponse.json({ error: "Pay period and basic salary are required" }, { status: 400 })
    }

    // Calculate gross and net salary
    const grossSalary = basicSalary + (housingAllow || 0) + (transportAllow || 0) + (mealAllow || 0) + (otherAllow || 0)
    const netSalary = grossSalary - (taxDeduction || 0) - (insuranceDed || 0) - (otherDed || 0)

    // Store payslip in memory (in production, save to database)
    const storedPayslips = (global as any).employeePayslips || {}
    if (!storedPayslips[employeeId]) {
      storedPayslips[employeeId] = []
    }
    
    const newPayslip = {
      id: Math.random().toString(36).substr(2, 9),
      employeeId: employeeId,
      payPeriod,
      basicSalary,
      housingAllow: housingAllow || 0,
      transportAllow: transportAllow || 0,
      mealAllow: mealAllow || 0,
      otherAllow: otherAllow || 0,
      grossSalary,
      taxDeduction: taxDeduction || 0,
      insuranceDed: insuranceDed || 0,
      otherDed: otherDed || 0,
      netSalary,
      currency: currency || "USD",
      status: "DRAFT",
      createdAt: new Date().toISOString(),
      approvedBy: null,
      approvedAt: null,
    }
    
    storedPayslips[employeeId].push(newPayslip)
    ;(global as any).employeePayslips = storedPayslips

    // TODO: Send email with payslip PDF if sendEmail is true
    // if (sendEmail) {
    //   await sendPayslipEmail(employee.user.email, newPayslip)
    // }

    // TODO: Generate PDF payslip
    // const pdfGenerated = await generatePayslipPDF(newPayslip)

    return NextResponse.json({
      ...newPayslip,
      pdfGenerated: false, // Will be true when PDF generation is implemented
      emailSent: sendEmail ? false : true, // Will be true when email is implemented
    }, { status: 201 })
  } catch (error) {
    console.error("Error generating payslip:", error)
    return NextResponse.json(
      { error: "Failed to generate payslip" },
      { status: 500 }
    )
  }
}
