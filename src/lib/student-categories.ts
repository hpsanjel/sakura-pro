export const STUDENT_CATEGORIES = {
  VISITOR: {
    label: "Visitor",
    description: "Just browsing or initial inquiry",
    color: "bg-gray-100 text-gray-800",
    requiredFields: ["name", "phone"],
    nextCategory: "PROSPECT",
    autoUpgradeConditions: {
      minDocumentsProvided: 2,
      hasStudyGoals: true
    }
  },
  PROSPECT: {
    label: "Prospect", 
    description: "Serious interest, basic info collected",
    color: "bg-blue-100 text-blue-800",
    requiredFields: ["name", "phone", "studyGoals"],
    nextCategory: "APPLIED",
    autoUpgradeConditions: {
      minDocumentsProvided: 5,
      hasFinancialProof: true
    }
  },
  APPLIED: {
    label: "Applied",
    description: "Application submitted",
    color: "bg-purple-100 text-purple-800", 
    requiredFields: ["name", "phone", "studyGoals", "financialProof"],
    nextCategory: "COMMITTED",
    autoUpgradeConditions: {
      depositPaid: true,
      documentsVerified: true
    }
  },
  COMMITTED: {
    label: "Committed",
    description: "Deposit paid, documents submitted",
    color: "bg-green-100 text-green-800",
    requiredFields: ["name", "phone", "studyGoals", "financialProof"],
    nextCategory: "ENROLLED",
    autoUpgradeConditions: {
      classEnrolled: true
    }
  },
  ENROLLED: {
    label: "Enrolled",
    description: "Active language class student",
    color: "bg-indigo-100 text-indigo-800",
    nextCategory: "ALUMNI",
    autoUpgradeConditions: {
      classCompleted: true
    }
  },
  ALUMNI: {
    label: "Alumni",
    description: "Completed program successfully",
    color: "bg-emerald-100 text-emerald-800",
    nextCategory: null
  }
} as const

export type StudentCategory = keyof typeof STUDENT_CATEGORIES

export const getCategoryColor = (category: string) => {
  return STUDENT_CATEGORIES[category as StudentCategory]?.color || "bg-gray-100 text-gray-800"
}

export const getCategoryLabel = (category: string) => {
  return STUDENT_CATEGORIES[category as StudentCategory]?.label || category
}

export const getCategoryDescription = (category: string) => {
  return STUDENT_CATEGORIES[category as StudentCategory]?.description || ""
}

export const canUpgradeCategory = (student: any, targetCategory: StudentCategory) => {
  const categoryConfig = STUDENT_CATEGORIES[targetCategory]
  if (!categoryConfig || !('autoUpgradeConditions' in categoryConfig) || !categoryConfig.autoUpgradeConditions) return false

  const conditions = categoryConfig.autoUpgradeConditions

  // Check documents
  const docCount = student.documents?.length || 0
  if ('minDocumentsProvided' in conditions && conditions.minDocumentsProvided && 
      docCount < conditions.minDocumentsProvided) {
    return false
  }

  // Check study goals
  if ('hasStudyGoals' in conditions && conditions.hasStudyGoals && !student.studyGoals) {
    return false
  }

  // Check financial proof
  if ('hasFinancialProof' in conditions && conditions.hasFinancialProof && !student.financialProof) {
    return false
  }

  // Check deposit status (would need to add deposit tracking)
  if ('depositPaid' in conditions && conditions.depositPaid && !student.depositPaid) {
    return false
  }

  // Check document verification
  if ('documentsVerified' in conditions && conditions.documentsVerified) {
    const verifiedDocs = student.documents?.filter((doc: any) => doc.status === "VERIFIED").length || 0
    if (verifiedDocs < 3) return false // Require at least 3 verified docs
  }

  return true
}
