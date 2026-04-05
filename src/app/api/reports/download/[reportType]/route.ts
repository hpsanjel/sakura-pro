import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Download specific report as CSV
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reportType: string }> }
) {
  const { reportType } = await params
  
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only ADMIN can download reports
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const consultancyId = session.user.consultancyId

    let csvData = ""
    let filename = ""

    switch (reportType) {
      case "students":
        csvData = await generateStudentsReport(consultancyId)
        filename = "students-report"
        break
      
      case "applications":
        csvData = await generateApplicationsReport(consultancyId)
        filename = "applications-report"
        break
      
      case "visa-status":
        csvData = await generateVisaStatusReport(consultancyId)
        filename = "visa-status-report"
        break
      
      case "financial":
        csvData = await generateFinancialReport(consultancyId)
        filename = "financial-report"
        break
      
      case "enrollments":
        csvData = await generateEnrollmentsReport(consultancyId)
        filename = "enrollments-report"
        break
      
      case "documents":
        csvData = await generateDocumentsReport(consultancyId)
        filename = "documents-report"
        break
      
      default:
        return NextResponse.json({ error: "Invalid report type" }, { status: 400 })
    }

    // Return CSV file
    return new NextResponse(csvData, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}-${new Date().toISOString().split('T')[0]}.csv"`
      }
    })
  } catch (error) {
    console.error(`Error generating ${reportType} report:`, error)
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    )
  }
}

async function generateStudentsReport(consultancyId: string): Promise<string> {
  const students = await prisma.student.findMany({
    where: { consultancyId },
    include: {
      _count: {
        select: {
          documents: true,
          applications: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  const headers = [
    "ID", "Name", "Passport Number", "Date of Birth", "Phone",
    "Address", "Education", "Japanese Level", "Intake", "Visa Status",
    "Study Goals", "Preferred Study Field", "Work Experience",
    "Financial Proof", "Documents Count", "Applications Count", "Created At"
  ]

  const rows = students.map(student => [
    student.id,
    student.name,
    student.passportNumber,
    student.dateOfBirth?.toISOString().split('T')[0] || "",
    student.phone || "",
    student.address || "",
    student.education || "",
    student.japaneseLanguageLevel,
    student.intake,
    student.visaStatus,
    student.studyGoals || "",
    student.preferredStudyField || "",
    student.workExperience || "",
    student.financialProof || "",
    student._count.documents.toString(),
    student._count.applications.toString(),
    student.createdAt.toISOString().split('T')[0]
  ])

  return convertToCSV(headers, rows.map(row => row.map(field => (field as any instanceof Date) ? (field as any).toISOString().split('T')[0] : (field || ""))))
}

async function generateApplicationsReport(consultancyId: string): Promise<string> {
  const applications = await prisma.application.findMany({
    where: {
      school: { consultancyId }
    },
    include: {
      student: {
        select: {
          name: true,
          passportNumber: true,
          visaStatus: true
        }
      },
      school: {
        select: {
          name: true,
          address: true,
          website: true
        }
      }
    },
    orderBy: { appliedAt: 'desc' }
  })

  const headers = [
    "ID", "Student Name", "Passport Number", "Student Visa Status",
    "School Name", "School Address", "School Website",
    "Application Status", "Notes", "Applied At"
  ]

  const rows = applications.map(app => [
    app.id,
    app.student.name,
    app.student.passportNumber,
    app.student.visaStatus,
    app.school.name,
    app.school.address || "",
    app.school.website || "",
    app.status || "PENDING",
    app.notes || "",
    app.appliedAt.toISOString().split('T')[0]
  ])

  return convertToCSV(headers, rows.map(row => row.map(field => (field as any instanceof Date) ? (field as any).toISOString().split('T')[0] : (field || ""))))
}

async function generateVisaStatusReport(consultancyId: string): Promise<string> {
  const students = await prisma.student.findMany({
    where: { consultancyId },
    include: {
      _count: {
        select: {
          documents: true,
          applications: true
        }
      }
    },
    orderBy: { visaStatus: 'asc' }
  })

  const headers = [
    "Student Name", "Passport Number", "Current Visa Status",
    "Date of Birth", "Phone", "Japanese Level", "Documents Count",
    "Applications Count", "Created At", "Last Updated"
  ]

  const rows = students.map(student => [
    student.name,
    student.passportNumber,
    student.visaStatus,
    student.dateOfBirth?.toISOString().split('T')[0] || "",
    student.phone || "",
    student.japaneseLanguageLevel,
    student._count.documents.toString(),
    student._count.applications.toString(),
    student.createdAt.toISOString().split('T')[0],
    student.updatedAt.toISOString().split('T')[0]
  ])

  return convertToCSV(headers, rows.map(row => row.map(field => (field as any instanceof Date) ? (field as any).toISOString().split('T')[0] : (field || ""))))
}

async function generateFinancialReport(consultancyId: string): Promise<string> {
  // This is a basic financial report - in a real system, you'd have actual financial data
  const students = await prisma.student.findMany({
    where: { consultancyId },
    include: {
      _count: {
        select: {
          applications: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  const headers = [
    "Student Name", "Passport Number", "Financial Proof Status",
    "Sponsor Information", "Application Count", "Estimated Revenue",
    "Created At"
  ]

  const rows = students.map(student => [
    student.name,
    student.passportNumber,
    student.financialProof || "Not Provided",
    "Sponsor info would be here", // This would come from a sponsors table
    student._count.applications.toString(),
    "1000", // This would be calculated based on actual pricing
    student.createdAt.toISOString().split('T')[0]
  ])

  return convertToCSV(headers, rows.map(row => row.map(field => (field as any instanceof Date) ? (field as any).toISOString().split('T')[0] : (field || ""))))
}

async function generateEnrollmentsReport(consultancyId: string): Promise<string> {
  const enrollments = await prisma.classEnrollment.findMany({
    where: {
      class: {
        teacher: { consultancyId }
      }
    },
    include: {
      student: {
        select: {
          name: true,
          passportNumber: true,
          visaStatus: true
        }
      },
      class: {
        select: {
          name: true,
          level: true,
          teacher: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      },
      schedule: {
        select: {
          dayOfWeek: true,
          startTime: true,
          endTime: true,
          room: true
        }
      }
    },
    orderBy: { enrolledAt: 'desc' }
  })

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

  const headers = [
    "Student Name", "Passport Number", "Student Visa Status",
    "Class Name", "Level", "Teacher", "Day", "Start Time", "End Time",
    "Room", "Enrolled At", "Status"
  ]

  const rows = enrollments.map(enrollment => [
    enrollment.student.name,
    enrollment.student.passportNumber,
    enrollment.student.visaStatus,
    enrollment.class.name,
    enrollment.class.level,
    `${enrollment.class.teacher.firstName} ${enrollment.class.teacher.lastName}`,
    dayNames[enrollment.schedule.dayOfWeek],
    enrollment.schedule.startTime,
    enrollment.schedule.endTime,
    enrollment.schedule.room || "",
    enrollment.enrolledAt.toISOString().split('T')[0],
    enrollment.isActive ? "Active" : "Inactive"
  ])

  return convertToCSV(headers, rows.map(row => row.map(field => (field as any instanceof Date) ? (field as any).toISOString().split('T')[0] : (field || ""))))
}

async function generateDocumentsReport(consultancyId: string): Promise<string> {
  const documents = await prisma.document.findMany({
    where: {
      student: { consultancyId }
    },
    include: {
      student: {
        select: {
          name: true,
          passportNumber: true,
          visaStatus: true
        }
      }
    },
    orderBy: { uploadedAt: 'desc' }
  })

  const headers = [
    "Student Name", "Passport Number", "Student Visa Status",
    "Document Type", "File Name", "Status", "Notes",
    "Uploaded At", "Verified At"
  ]

  const rows = documents.map(doc => [
    doc.student.name,
    doc.student.passportNumber,
    doc.student.visaStatus,
    doc.type,
    doc.fileName,
    doc.status,
    doc.notes || "",
    doc.uploadedAt?.toISOString().split('T')[0] || "",
    doc.verifiedAt?.toISOString().split('T')[0] || ""
  ])

  return convertToCSV(headers, rows.map(row => row.map(field => (field as any instanceof Date) ? (field as any).toISOString().split('T')[0] : (field || ""))))
}

function convertToCSV(headers: string[], rows: string[][]): string {
  const csvHeaders = headers.join(",")
  const csvRows = rows.map(row => 
    row.map(field => `"${field.toString().replace(/"/g, '""')}"`).join(",")
  )
  
  return [csvHeaders, ...csvRows].join("\n")
}
