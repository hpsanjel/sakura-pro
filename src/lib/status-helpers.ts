import { validateVisaStatusTransition, getNextValidStatuses, getStatusProgression } from "@/lib/visa-validation"
import { prisma } from "@/lib/prisma"

export async function getStudentStatusRequirements(studentId: string, currentStatus: string) {
  const nextStatuses = getNextValidStatuses(currentStatus)
  const requirements = []

  for (const nextStatus of nextStatuses) {
    if (nextStatus === "REJECTED") continue // Skip rejected for normal requirements
    
    const validation = await validateVisaStatusTransition(studentId, nextStatus, currentStatus)
    
    requirements.push({
      status: nextStatus,
      isAllowed: validation.isValid,
      errors: validation.errors,
      warnings: validation.warnings,
      label: getStatusProgression().find(s => s.status === nextStatus)?.label || nextStatus
    })
  }

  return requirements
}

export function getStatusDescription(status: string): string {
  const descriptions: Record<string, string> = {
    "NEW_LEAD": "Initial inquiry received. Student is interested in studying in Japan.",
    "DOCS_PENDING": "Waiting for required documents. Student needs to upload all necessary paperwork.",
    "DOCS_VERIFIED": "All documents uploaded and verified by counselor. Ready for school applications.",
    "SENT_TO_JAPAN": "Application sent to Japanese schools. Waiting for acceptance letters.",
    "COE_APPLIED": "Certificate of Eligibility applied for through Japanese immigration.",
    "COE_APPROVED": "Certificate of Eligibility approved. Ready for visa application.",
    "VISA_APPLIED": "Student visa application submitted to embassy.",
    "VISA_APPROVED": "Student visa approved. Ready for travel to Japan.",
    "REJECTED": "Application rejected at some stage. Process ended."
  }
  
  return descriptions[status] || "Unknown status"
}

export function getRequiredDocumentsForStatus(status: string): string[] {
  const documentRequirements: Record<string, string[]> = {
    "NEW_LEAD": [],
    "DOCS_PENDING": [],
    "DOCS_VERIFIED": [
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
    ],
    "SENT_TO_JAPAN": [
      "All documents from DOCS_VERIFIED",
      "School application forms",
      "Application fees paid"
    ],
    "COE_APPLIED": [
      "All documents from SENT_TO_JAPAN",
      "School acceptance letter",
      "COE application forms"
    ],
    "COE_APPROVED": [
      "All documents from COE_APPLIED",
      "Approved COE document"
    ],
    "VISA_APPLIED": [
      "All documents from COE_APPROVED",
      "Visa application forms",
      "Visa fee payment"
    ],
    "VISA_APPROVED": [
      "All documents from VISA_APPLIED",
      "Approved visa in passport"
    ],
    "REJECTED": []
  }
  
  return documentRequirements[status] || []
}
