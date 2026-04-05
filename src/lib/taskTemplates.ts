// Task templates for counselor ease-of-use
export interface TaskTemplate {
  id: string
  categoryId: string
  title: string
  description: string
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  estimatedDays?: number
  checklistItems: string[]
  helpfulLinks?: string[]
  counselorNotes?: string
}

export interface TaskCategory {
  id: string
  name: string
  icon: string
  color: string
  description: string
}

// Predefined task categories for study abroad process
export const TASK_CATEGORIES: TaskCategory[] = [
  {
    id: "application_docs",
    name: "Application Documents",
    icon: "📄",
    color: "#3B82F6",
    description: "Documents required for university applications"
  },
  {
    id: "visa_preparation",
    name: "Visa Preparation",
    icon: "🛂",
    color: "#EF4444",
    description: "Visa application and preparation tasks"
  },
  {
    id: "financial_docs",
    name: "Financial Documents",
    icon: "💰",
    color: "#10B981",
    description: "Financial documentation and payments"
  },
  {
    id: "pre_departure",
    name: "Pre-Departure",
    icon: "✈️",
    color: "#8B5CF6",
    description: "Tasks before traveling to Japan"
  },
  {
    id: "language_preparation",
    name: "Language Preparation",
    icon: "🈵",
    color: "#F59E0B",
    description: "Japanese language learning and testing"
  },
  {
    id: "accommodation",
    name: "Accommodation",
    icon: "🏠",
    color: "#06B6D4",
    description: "Housing and living arrangements"
  },
  {
    id: "health_medical",
    name: "Health & Medical",
    icon: "🏥",
    color: "#EC4899",
    description: "Health insurance and medical requirements"
  },
  {
    id: "communication",
    name: "Communication",
    icon: "📞",
    color: "#14B8A6",
    description: "Communication with schools and authorities"
  }
]

// Predefined task templates
export const TASK_TEMPLATES: TaskTemplate[] = [
  // Application Documents
  {
    id: "passport_copy",
    categoryId: "application_docs",
    title: "Submit Passport Copy",
    description: "Provide a clear scanned copy of your passport for university application",
    priority: "HIGH",
    estimatedDays: 2,
    checklistItems: [
      "Scan passport information page",
      "Ensure scan is clear and readable",
      "Save as PDF or high-quality JPEG",
      "Upload to document portal"
    ],
    helpfulLinks: ["https://www.mofa.go.jp/passport/"],
    counselorNotes: "Ensure passport is valid for at least 6 months beyond intended stay period"
  },
  {
    id: "transcript_certificates",
    categoryId: "application_docs",
    title: "Submit Academic Transcripts",
    description: "Provide official academic transcripts and certificates from previous education",
    priority: "HIGH",
    estimatedDays: 7,
    checklistItems: [
      "Request official transcripts from school",
      "Get English translations if needed",
      "Obtain graduation certificates",
      "Scan all documents clearly",
      "Upload with proper naming convention"
    ],
    counselorNotes: "Some universities may require transcripts in sealed envelopes directly from school"
  },
  {
    id: "recommendation_letters",
    categoryId: "application_docs",
    title: "Obtain Recommendation Letters",
    description: "Secure academic recommendation letters from teachers or professors",
    priority: "MEDIUM",
    estimatedDays: 14,
    checklistItems: [
      "Identify suitable recommenders",
      "Provide recommenders with necessary forms",
      "Give recommenders your resume and statement",
      "Follow up politely after 1 week",
      "Collect signed and sealed letters"
    ],
    counselorNotes: "Choose recommenders who know you well and can speak to your academic abilities"
  },
  {
    id: "statement_of_purpose",
    categoryId: "application_docs",
    title: "Write Statement of Purpose",
    description: "Draft a compelling statement of purpose for university applications",
    priority: "HIGH",
    estimatedDays: 10,
    checklistItems: [
      "Research university requirements",
      "Outline key points and experiences",
      "Write first draft focusing on goals",
      "Highlight relevant academic background",
      "Explain why this university/program",
      "Proofread and edit carefully",
      "Get feedback from counselor/teacher"
    ],
    counselorNotes: "Tailor each SOP to the specific university and program requirements"
  },

  // Visa Preparation
  {
    id: "visa_application_form",
    categoryId: "visa_preparation",
    title: "Complete Visa Application Form",
    description: "Fill out the Japanese student visa application form accurately",
    priority: "HIGH",
    estimatedDays: 3,
    checklistItems: [
      "Download latest visa application form",
      "Read instructions carefully",
      "Fill form in black ink or type",
      "Answer all questions truthfully",
      "Double-check for errors",
      "Sign and date the form"
    ],
    helpfulLinks: ["https://www.mofa.go.jp/e/visa/tourist/visa.html"],
    counselorNotes: "Any false information can lead to visa rejection"
  },
  {
    id: "visa_photos",
    categoryId: "visa_preparation",
    title: "Submit Visa Photos",
    description: "Provide passport-sized photos meeting Japanese visa requirements",
    priority: "MEDIUM",
    estimatedDays: 2,
    checklistItems: [
      "Check photo specifications (45mm x 35mm)",
      "Visit professional photo studio",
      "Wear formal attire (no uniforms)",
      "Ensure plain white background",
      "Get 2-3 recent photos",
      "Photos must be within 6 months"
    ],
    counselorNotes: "Selfies or casual photos will not be accepted"
  },
  {
    id: "coe_preparation",
    categoryId: "visa_preparation",
    title: "Prepare Certificate of Eligibility Documents",
    description: "Gather all documents required for Certificate of Eligibility application",
    priority: "HIGH",
    estimatedDays: 5,
    checklistItems: [
      "Fill COE application form",
      "Prepare passport copy",
      "Include admission certificate",
      "Add financial proof documents",
      "Include personal history form",
      "Submit to university for processing"
    ],
    counselorNotes: "COE processing can take 2-3 months, so submit as early as possible"
  },

  // Financial Documents
  {
    id: "bank_statement",
    categoryId: "financial_docs",
    title: "Submit Bank Statement",
    description: "Provide recent bank statement showing sufficient funds for studies",
    priority: "HIGH",
    estimatedDays: 3,
    checklistItems: [
      "Get statement from last 6 months",
      "Ensure sufficient balance is shown",
      "Translate if not in English/Japanese",
      "Get bank verification letter",
      "Scan and upload clearly"
    ],
    counselorNotes: "Balance should cover tuition + living expenses for first year"
  },
  {
    id: "sponsor_documents",
    categoryId: "financial_docs",
    title: "Submit Sponsor Documents",
    description: "Provide financial sponsor's documents and declaration of support",
    priority: "HIGH",
    estimatedDays: 7,
    checklistItems: [
      "Get sponsor's bank statement",
      "Obtain sponsor's income proof",
      "Fill sponsor declaration form",
      "Include sponsor's relationship proof",
      "Get sponsor's ID documents",
      "Notarize if required"
    ],
    counselorNotes: "Sponsor must be able to demonstrate sufficient income to support student"
  },
  {
    id: "tuition_payment",
    categoryId: "financial_docs",
    title: "Pay Tuition Deposit",
    description: "Pay the required tuition deposit to secure admission",
    priority: "URGENT",
    estimatedDays: 3,
    checklistItems: [
      "Check payment deadline",
      "Confirm payment amount and method",
      "Arrange for international transfer",
      "Get payment receipt",
      "Submit receipt to university",
      "Keep copy for records"
    ],
    counselorNotes: "Late payment may result in admission cancellation"
  },

  // Language Preparation
  {
    id: "jlpt_registration",
    categoryId: "language_preparation",
    title: "Register for JLPT Exam",
    description: "Register for Japanese Language Proficiency Test if required",
    priority: "MEDIUM",
    estimatedDays: 2,
    checklistItems: [
      "Check JLPT test dates",
      "Determine required level (N5/N4/N3)",
      "Complete online registration",
      "Pay registration fee",
      "Download admission ticket",
      "Prepare for exam day"
    ],
    helpfulLinks: ["https://www.jlpt.jp/e/"],
    counselorNotes: "Many universities require JLPT N5 or N4 for admission"
  },
  {
    id: "language_study_plan",
    categoryId: "language_preparation",
    title: "Create Japanese Study Plan",
    description: "Develop a structured plan for Japanese language learning",
    priority: "MEDIUM",
    estimatedDays: 3,
    checklistItems: [
      "Assess current Japanese level",
      "Set target proficiency level",
      "Create daily study schedule",
      "Choose study materials/textbooks",
      "Plan practice with native speakers",
      "Set milestones and deadlines"
    ],
    helpfulLinks: ["https://www.marugoto.org/", "https://www.minna-no-nihongo.com/"],
    counselorNotes: "Consistent daily practice is more effective than cramming"
  },

  // Pre-Departure
  {
    id: "flight_booking",
    categoryId: "pre_departure",
    title: "Book Flight to Japan",
    description: "Book international flight to Japan with appropriate dates",
    priority: "MEDIUM",
    estimatedDays: 5,
    checklistItems: [
      "Check visa processing timeline",
      "Compare flight prices and airlines",
      "Book flexible ticket if possible",
      "Check baggage allowance",
      "Arrive 1-2 weeks before orientation",
      "Share flight details with university"
    ],
    helpfulLinks: ["https://www.skyscanner.com/", "https://www.expedia.com/"],
    counselorNotes: "Don't book flights until visa is approved"
  },
  {
    id: "travel_insurance",
    categoryId: "pre_departure",
    title: "Get Travel Insurance",
    description: "Purchase comprehensive travel insurance for Japan",
    priority: "HIGH",
    estimatedDays: 3,
    checklistItems: [
      "Research insurance providers",
      "Compare coverage and prices",
      "Ensure medical coverage is adequate",
      "Check if covers study period",
      "Purchase insurance policy",
      "Save policy documents digitally"
    ],
    counselorNotes: "Some universities require specific insurance coverage"
  },
  {
    id: "packing_preparation",
    categoryId: "pre_departure",
    title: "Prepare Luggage Packing",
    description: "Pack essential items for living and studying in Japan",
    priority: "LOW",
    estimatedDays: 7,
    checklistItems: [
      "Check airline baggage limits",
      "Pack essential documents separately",
      "Include appropriate clothing for season",
      "Pack electronics and adapters",
      "Bring some local currency",
      "Prepare medications with prescriptions"
    ],
    counselorNotes: "Pack light but don't forget essentials that might be hard to find in Japan"
  },

  // Accommodation
  {
    id: "accommodation_application",
    categoryId: "accommodation",
    title: "Apply for Student Accommodation",
    description: "Complete and submit student housing application",
    priority: "HIGH",
    estimatedDays: 5,
    checklistItems: [
      "Research available accommodation options",
      "Complete housing application form",
      "Submit required documents",
      "Pay accommodation deposit",
      "Sign housing contract",
      "Confirm move-in date"
    ],
    counselorNotes: "Student dormitories fill up quickly, apply early"
  },
  {
    id: "housing_documents",
    categoryId: "accommodation",
    title: "Prepare Housing Documents",
    description: "Gather all documents required for rental accommodation",
    priority: "MEDIUM",
    estimatedDays: 3,
    checklistItems: [
      "Prepare guarantor documents",
      "Get proof of scholarship/funding",
      "Fill rental application forms",
      "Prepare emergency contact info",
      "Translate documents if needed"
    ],
    counselorNotes: "Japanese rental requirements can be complex, start early"
  },

  // Health & Medical
  {
    id: "medical_certificate",
    categoryId: "health_medical",
    title: "Get Medical Certificate",
    description: "Obtain medical certificate as required by university/visa",
    priority: "MEDIUM",
    estimatedDays: 5,
    checklistItems: [
      "Schedule doctor appointment",
      "Take medical form to doctor",
      "Complete required medical tests",
      "Get doctor's signature and stamp",
      "Translate if not in English",
      "Submit to university"
    ],
    counselorNotes: "Some universities have specific medical forms that must be used"
  },
  {
    id: "health_insurance",
    categoryId: "health_medical",
    title: "Enroll in Health Insurance",
    description: "Register for Japanese National Health Insurance",
    priority: "HIGH",
    estimatedDays: 2,
    checklistItems: [
      "Research NHI requirements",
      "Prepare residence card",
      "Visit local municipal office",
      "Complete NHI registration",
      "Pay initial premium",
      "Get insurance card"
    ],
    helpfulLinks: ["https://www.mhlw.go.jp/english/"],
    counselorNotes: "NHI is mandatory for all residents in Japan staying more than 3 months"
  }
]

// Helper functions
export const getTasksByCategory = (categoryId: string): TaskTemplate[] => {
  return TASK_TEMPLATES.filter(template => template.categoryId === categoryId)
}

export const getTaskTemplate = (templateId: string): TaskTemplate | undefined => {
  return TASK_TEMPLATES.find(template => template.id === templateId)
}

export const getCategoryById = (categoryId: string): TaskCategory | undefined => {
  return TASK_CATEGORIES.find(category => category.id === categoryId)
}
