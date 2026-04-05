import { prisma } from "@/lib/prisma"

export interface VisaStatusValidation {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

// Define the visa status progression order and requirements
const VISA_STATUS_REQUIREMENTS = {
  NEW_LEAD: {
    order: 1,
    label: "New Lead",
    prerequisites: [],
    checks: [],
    description: "Initial inquiry received"
  },
  DOCS_PENDING: {
    order: 2,
    label: "Documents Pending",
    prerequisites: ["NEW_LEAD"],
    checks: [],
    description: "Waiting for required documents"
  },
  DOCS_VERIFIED: {
    order: 3,
    label: "Documents Verified",
    prerequisites: ["DOCS_PENDING"],
    checks: ["allDocumentsUploaded", "allDocumentsVerified"],
    description: "All documents uploaded and verified"
  },
  SENT_TO_JAPAN: {
    order: 4,
    label: "Sent to Japan",
    prerequisites: ["DOCS_VERIFIED"],
    checks: ["schoolApplicationsSubmitted"],
    description: "Application sent to Japanese schools"
  },
  COE_APPLIED: {
    order: 5,
    label: "COE Applied",
    prerequisites: ["SENT_TO_JAPAN"],
    checks: ["schoolAcceptanceReceived", "coeApplicationSubmitted"],
    description: "Certificate of Eligibility applied"
  },
  COE_APPROVED: {
    order: 6,
    label: "COE Approved",
    prerequisites: ["COE_APPLIED"],
    checks: ["coeApproved"],
    description: "Certificate of Eligibility approved"
  },
  VISA_APPLIED: {
    order: 7,
    label: "Visa Applied",
    prerequisites: ["COE_APPROVED"],
    checks: ["visaApplicationSubmitted"],
    description: "Student visa application submitted"
  },
  VISA_APPROVED: {
    order: 8,
    label: "Visa Approved",
    prerequisites: ["VISA_APPLIED"],
    checks: ["visaApproved"],
    description: "Student visa approved"
  },
  REJECTED: {
    order: 9,
    label: "Rejected",
    prerequisites: [], // Can be rejected at any stage
    checks: [],
    description: "Application rejected"
  }
}

export async function validateVisaStatusTransition(
  studentId: string,
  newStatus: string,
  currentStatus: string
): Promise<VisaStatusValidation> {
  const errors: string[] = []
  const warnings: string[] = []

  // Check if the status exists
  const statusInfo = VISA_STATUS_REQUIREMENTS[newStatus as keyof typeof VISA_STATUS_REQUIREMENTS]
  if (!statusInfo) {
    errors.push(`Invalid visa status: ${newStatus}`)
    return { isValid: false, errors, warnings }
  }

  // Special handling for REJECTED status
  if (newStatus === "REJECTED") {
    warnings.push("Moving to REJECTED status. This will end the student's application process.")
    return { isValid: true, errors, warnings }
  }

  // Check progression order - can't skip stages
  const currentOrder = VISA_STATUS_REQUIREMENTS[currentStatus as keyof typeof VISA_STATUS_REQUIREMENTS]?.order || 0
  const newOrder = statusInfo.order

  if (newOrder <= currentOrder && currentStatus !== "REJECTED") {
    errors.push(`Cannot move from ${currentStatus} to ${newStatus}. Progression must move forward.`)
    return { isValid: false, errors, warnings }
  }

  // Check prerequisites
  for (const prerequisite of statusInfo.prerequisites) {
    if (prerequisite !== currentStatus && prerequisite !== "REJECTED") {
      errors.push(`Must complete ${prerequisite} before moving to ${newStatus}`)
    }
  }

  // Get student data for validation checks
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      documents: true,
      applications: {
        include: {
          school: true
        }
      }
    }
  })

  if (!student) {
    errors.push("Student not found")
    return { isValid: false, errors, warnings }
  }

  // Run specific validation checks
  for (const check of statusInfo.checks) {
    const checkResult = await runValidationCheck(check, student)
    if (!checkResult.isValid) {
      errors.push(...checkResult.errors)
    }
    warnings.push(...checkResult.warnings)
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

async function runValidationCheck(check: string, student: any): Promise<VisaStatusValidation> {
  const errors: string[] = []
  const warnings: string[] = []

  switch (check) {
    case "allDocumentsUploaded":
      const requiredDocTypes1 = [
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

      const uploadedDocs = student.documents.filter((doc: any) => 
        doc.status === "UPLOADED" || doc.status === "VERIFIED"
      )

      if (uploadedDocs.length < requiredDocTypes1.length) {
        const missingDocs = requiredDocTypes1.filter(type => 
          !uploadedDocs.some((doc: any) => doc.type === type)
        )
        errors.push(`Missing documents: ${missingDocs.join(", ")}`)
      }
      break

    case "allDocumentsVerified":
      const verifiedDocs = student.documents.filter((doc: any) => 
        doc.status === "VERIFIED"
      )
      const requiredDocTypes2 = [
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

      if (verifiedDocs.length < requiredDocTypes2.length) {
        const unverifiedDocs = student.documents.filter((doc: any) => 
          doc.status === "UPLOADED" &&
          requiredDocTypes2.includes(doc.type)
        )
        if (unverifiedDocs.length > 0) {
          errors.push(`Unverified documents: ${unverifiedDocs.map((doc: any) => doc.type).join(", ")}`)
        }
      }
      break

    case "schoolApplicationsSubmitted":
      if (!student.applications || student.applications.length === 0) {
        errors.push("No school applications found")
      } else {
        const hasSubmittedApps = student.applications.some((app: any) => 
          app.status === "SUBMITTED" || app.status === "ACCEPTED"
        )
        if (!hasSubmittedApps) {
          errors.push("No submitted school applications found")
        }
      }
      break

    case "schoolAcceptanceReceived":
      if (!student.applications || student.applications.length === 0) {
        errors.push("No school applications found")
      } else {
        const hasAcceptedApp = student.applications.some((app: any) => 
          app.status === "ACCEPTED"
        )
        if (!hasAcceptedApp) {
          errors.push("No school acceptance received")
        }
      }
      break

    case "coeApplicationSubmitted":
      // This would typically be tracked in a separate COE applications table
      // For now, we'll check if there's an accepted school application
      if (!student.applications || !student.applications.some((app: any) => app.status === "ACCEPTED")) {
        errors.push("Cannot apply for COE without school acceptance")
      }
      break

    case "coeApproved":
      // This would typically be tracked in student records or COE status
      warnings.push("COE approval should be verified with official documentation")
      break

    case "visaApplicationSubmitted":
      // This would typically be tracked in a separate visa applications table
      warnings.push("Visa application submission should be documented")
      break

    case "visaApproved":
      // This would typically be tracked in student records
      warnings.push("Visa approval should be verified with official documentation")
      break

    default:
      warnings.push(`Unknown validation check: ${check}`)
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

export function getNextValidStatuses(currentStatus: string): string[] {
  const currentOrder = VISA_STATUS_REQUIREMENTS[currentStatus as keyof typeof VISA_STATUS_REQUIREMENTS]?.order || 0
  
  return Object.entries(VISA_STATUS_REQUIREMENTS)
    .filter(([_, info]) => info.order > currentOrder || info.order === 9) // Include REJECTED
    .map(([status, _]) => status)
}

export function getStatusProgression(): Array<{status: string, label: string, order: number}> {
  return Object.entries(VISA_STATUS_REQUIREMENTS)
    .filter(([_, info]) => info.order !== 9) // Exclude REJECTED from normal progression
    .map(([status, info]) => ({
      status,
      label: info.label,
      order: info.order
    }))
    .sort((a, b) => a.order - b.order)
}
