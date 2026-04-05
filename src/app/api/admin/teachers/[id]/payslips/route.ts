import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { generatePayslipPDF, PayslipData } from "@/lib/payslip-pdf"
import { sendPayslipEmail } from "@/lib/email"

const createPayslipSchema = z.object({
  payPeriod: z.string().min(1, "Pay period is required"),
  basicSalary: z.number().min(0, "Basic salary must be positive"),
  housingAllow: z.number().min(0).default(0),
  transportAllow: z.number().min(0).default(0),
  mealAllow: z.number().min(0).default(0),
  otherAllow: z.number().min(0).default(0),
  taxDeduction: z.number().min(0).default(0),
  insuranceDed: z.number().min(0).default(0),
  otherDed: z.number().min(0).default(0),
  currency: z.string().default("USD"),
  sendEmail: z.boolean().default(true),
})

// GET - Fetch all payslips for a teacher
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

    const { id: teacherId } = await params

    // Verify teacher exists and belongs to the same consultancy
    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
      include: {
        user: true,
      },
    })

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 })
    }

    if (teacher.consultancyId !== session.user.consultancyId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const payslips = await prisma.payslip.findMany({
      where: {
        teacherId: teacherId,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(payslips)
  } catch (error) {
    console.error("Error fetching payslips:", error)
    return NextResponse.json(
      { error: "Failed to fetch payslips" },
      { status: 500 }
    )
  }
}

// POST - Create a new payslip
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

    const { id: teacherId } = await params

    // Verify teacher exists and belongs to the same consultancy
    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
      include: {
        consultancy: true,
        user: true,
      },
    })

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 })
    }

    if (teacher.consultancyId !== session.user.consultancyId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    
    const validation = createPayslipSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.issues },
        { status: 400 }
      )
    }

    const { 
      payPeriod, basicSalary, housingAllow, transportAllow, 
      mealAllow, otherAllow, taxDeduction, insuranceDed, 
      otherDed, currency, sendEmail 
    } = validation.data

    // Calculate gross and net salary
    const grossSalary = basicSalary + housingAllow + transportAllow + mealAllow + otherAllow
    const totalDeductions = taxDeduction + insuranceDed + otherDed
    const netSalary = grossSalary - totalDeductions

    // Check if payslip for this period already exists
    const existingPayslip = await prisma.payslip.findFirst({
      where: {
        teacherId,
        payPeriod,
      },
    })

    if (existingPayslip) {
      return NextResponse.json(
        { error: "Payslip for this period already exists" },
        { status: 409 }
      )
    }

    const newPayslip = await prisma.payslip.create({
      data: {
        teacherId,
        payPeriod,
        basicSalary,
        housingAllow,
        transportAllow,
        mealAllow,
        otherAllow,
        grossSalary,
        taxDeduction,
        insuranceDed,
        otherDed,
        netSalary,
        currency,
        status: "SENT",
      },
    })

    // Generate PDF and send email
    try {
      const payslipData: PayslipData = {
        teacherName: `${teacher.firstName} ${teacher.lastName}`,
        teacherEmail: teacher.user.email,
        employeeId: teacher.employeeId || undefined,
        payPeriod,
        basicSalary,
        housingAllow,
        transportAllow,
        mealAllow,
        otherAllow,
        grossSalary,
        taxDeduction,
        insuranceDed,
        otherDed,
        totalDeductions,
        netSalary,
        currency,
        consultancyName: teacher.consultancy.name,
        consultancyAddress: teacher.consultancy.address || undefined,
        generatedDate: new Date().toLocaleDateString(),
      }

      const pdfBuffer = generatePayslipPDF(payslipData)

      if (sendEmail && teacher.user.email) {
        await sendPayslipEmail(
          teacher.user.email,
          payslipData.teacherName,
          {
            payPeriod,
            netSalary,
            currency,
          },
          pdfBuffer,
          teacher.consultancy.name
        )
      }

      return NextResponse.json({
        ...newPayslip,
        pdfGenerated: true,
        emailSent: sendEmail && teacher.user.email ? true : false,
      }, { status: 201 })
    } catch (pdfError) {
      console.error("Error generating PDF or sending email:", pdfError)
      // Still return the payslip even if PDF/email fails
      return NextResponse.json({
        ...newPayslip,
        pdfGenerated: false,
        emailSent: false,
        warning: "Payslip created but PDF generation or email failed",
      }, { status: 201 })
    }
  } catch (error) {
    console.error("Error creating payslip:", error)
    return NextResponse.json(
      { error: "Failed to create payslip" },
      { status: 500 }
    )
  }
}
