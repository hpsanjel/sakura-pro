// Simple API-based seeding script
const TODO_CATEGORIES = [
  {
    name: "Documentation",
    description: "All required documents and paperwork",
    color: "#3B82F6",
    icon: "📄",
    order: 1,
  },
  {
    name: "Application Process", 
    description: "School applications and paperwork",
    color: "#8B5CF6",
    icon: "📝",
    order: 2,
  },
  {
    name: "Financial",
    description: "Payments, fees, and financial documentation", 
    color: "#10B981",
    icon: "💰",
    order: 3,
  },
  {
    name: "Visa & Immigration",
    description: "Visa applications and immigration requirements",
    color: "#F59E0B", 
    icon: "🛂",
    order: 4,
  },
  {
    name: "Travel & Accommodation",
    description: "Flight booking, accommodation, and travel arrangements",
    color: "#EF4444",
    icon: "✈️", 
    order: 5,
  },
  {
    name: "Pre-Departure",
    description: "Final preparations before leaving",
    color: "#06B6D4",
    icon: "🎒",
    order: 6,
  },
  {
    name: "Post-Arrival",
    description: "Tasks after arriving in Japan",
    color: "#84CC16",
    icon: "🏠",
    order: 7,
  },
];

const TODO_TEMPLATES = [
  // INITIAL_ENQUIRY STAGE
  {
    title: "Research Japanese Schools and Programs",
    description: "Research and shortlist potential schools and programs in Japan",
    priority: "HIGH",
    estimatedDays: 7,
    isRequired: true,
    targetStage: "INITIAL_ENQUIRY",
    categoryName: "Application Process",
    checklistItems: [
      "Research school rankings and reputation",
      "Compare program curriculums", 
      "Check admission requirements",
      "Review tuition fees and costs",
      "Look for scholarship opportunities",
      "Read student reviews and testimonials"
    ],
    helpfulLinks: [
      "https://www.jasso.go.jp/en/study_j/school_e.html",
      "https://www.studyjapan.go.jp/en/",
      "https://www.mext.go.jp/en/"
    ]
  },
  {
    title: "Initial Consultation with Counselor",
    description: "Schedule and attend first consultation meeting",
    priority: "HIGH",
    estimatedDays: 2,
    isRequired: true,
    targetStage: "INITIAL_ENQUIRY", 
    categoryName: "Application Process",
    checklistItems: [
      "Schedule appointment with counselor",
      "Prepare questions about study in Japan",
      "Bring academic transcripts",
      "Discuss career goals and study preferences",
      "Get information about application timeline"
    ],
    helpfulLinks: []
  },

  // DOCUMENTATION STAGE
  {
    title: "Gather Academic Documents",
    description: "Collect all required academic transcripts and certificates",
    priority: "HIGH",
    estimatedDays: 5,
    isRequired: true,
    targetStage: "DOCUMENTATION",
    categoryName: "Documentation",
    checklistItems: [
      "Obtain high school transcripts",
      "Get college/university transcripts (if applicable)",
      "Collect graduation certificates",
      "Translate documents if not in English/Japanese",
      "Get documents notarized if required",
      "Make photocopies of all documents"
    ],
    helpfulLinks: []
  },
  {
    title: "Prepare Passport",
    description: "Ensure passport is valid and ready",
    priority: "URGENT",
    estimatedDays: 30,
    isRequired: true,
    targetStage: "DOCUMENTATION",
    categoryName: "Documentation", 
    checklistItems: [
      "Check passport expiration date (must be valid for entire stay)",
      "Apply for new passport if expiring soon",
      "Get passport photos taken",
      "Make copies of passport pages",
      "Scan passport for digital applications"
    ],
    helpfulLinks: [
      "https://www.passport.gov.ph/",
      "https://travel.state.gov/content/travel/en/passports.html"
    ]
  },
  {
    title: "Statement of Purpose (SOP)",
    description: "Write a compelling statement of purpose",
    priority: "HIGH",
    estimatedDays: 10,
    isRequired: true,
    targetStage: "DOCUMENTATION",
    categoryName: "Documentation",
    checklistItems: [
      "Research SOP writing guidelines",
      "Outline key points to include",
      "Write first draft",
      "Get feedback from counselor/teacher",
      "Revise and edit multiple times",
      "Proofread for grammar and spelling",
      "Format according to requirements"
    ],
    helpfulLinks: [
      "https://www.mext.go.jp/en/04_seikatsu.html"
    ]
  },
  {
    title: "Letters of Recommendation",
    description: "Request and collect letters of recommendation",
    priority: "HIGH",
    estimatedDays: 14,
    isRequired: true,
    targetStage: "DOCUMENTATION",
    categoryName: "Documentation",
    checklistItems: [
      "Identify suitable recommenders (teachers, employers)",
      "Contact recommenders and request letters",
      "Provide recommenders with necessary information",
      "Follow up politely if needed",
      "Collect sealed recommendation letters",
      "Make copies for multiple applications"
    ],
    helpfulLinks: []
  },

  // APPLICATION SUBMITTED STAGE
  {
    title: "Complete Online Application Forms",
    description: "Fill out and submit online application forms",
    priority: "HIGH",
    estimatedDays: 3,
    isRequired: true,
    targetStage: "APPLICATION_SUBMITTED",
    categoryName: "Application Process",
    checklistItems: [
      "Create accounts on school application portals",
      "Fill out personal information accurately",
      "Upload required documents",
      "Write application essays if required",
      "Review application before submission",
      "Pay application fees",
      "Submit applications before deadlines"
    ],
    helpfulLinks: []
  },
  {
    title: "Pay Application Fees",
    description: "Pay all required application fees",
    priority: "HIGH",
    estimatedDays: 2,
    isRequired: true,
    targetStage: "APPLICATION_SUBMITTED",
    categoryName: "Financial",
    checklistItems: [
      "Check application fee amounts for each school",
      "Arrange payment method (credit card, bank transfer)",
      "Pay fees before deadlines",
      "Keep payment receipts and confirmations",
      "Record payment details for tracking"
    ],
    helpfulLinks: []
  },

  // APPLICATION PROCESSING STAGE
  {
    title: "Monitor Application Status",
    description: "Track application progress and respond to requests",
    priority: "MEDIUM",
    estimatedDays: 60,
    isRequired: true,
    targetStage: "APPLICATION_PROCESSING",
    categoryName: "Application Process",
    checklistItems: [
      "Check application portals regularly",
      "Respond to requests for additional information",
      "Monitor email for communications from schools",
      "Keep counselor updated on application status",
      "Prepare for potential interviews"
    ],
    helpfulLinks: []
  },
  {
    title: "Prepare for Interviews",
    description: "Prepare for admission interviews if required",
    priority: "HIGH",
    estimatedDays: 7,
    isRequired: false,
    targetStage: "APPLICATION_PROCESSING",
    categoryName: "Application Process",
    checklistItems: [
      "Research common interview questions",
      "Practice interview answers",
      "Prepare questions to ask interviewers",
      "Test video conferencing setup",
      "Dress appropriately for interviews",
      "Follow up with thank-you notes"
    ],
    helpfulLinks: []
  },

  // OFFER RECEIVED STAGE
  {
    title: "Review Admission Offers",
    description: "Carefully review and compare admission offers",
    priority: "HIGH",
    estimatedDays: 5,
    isRequired: true,
    targetStage: "OFFER_RECEIVED",
    categoryName: "Application Process",
    checklistItems: [
      "Read all offer letters carefully",
      "Compare program details and benefits",
      "Review financial aid packages",
      "Check enrollment deadlines",
      "Consult with counselor about options",
      "Make final decision on school selection"
    ],
    helpfulLinks: []
  },
  {
    title: "Accept Admission Offer",
    description: "Accept the chosen admission offer",
    priority: "HIGH",
    estimatedDays: 2,
    isRequired: true,
    targetStage: "OFFER_RECEIVED",
    categoryName: "Application Process",
    checklistItems: [
      "Submit acceptance form",
      "Pay acceptance deposit if required",
      "Confirm enrollment details",
      "Save offer letter and acceptance confirmation",
      "Inform counselor of decision"
    ],
    helpfulLinks: []
  },

  // ACCEPTANCE CONFIRMED STAGE
  {
    title: "Pay Tuition Deposit",
    description: "Pay required tuition deposit",
    priority: "HIGH",
    estimatedDays: 3,
    isRequired: true,
    targetStage: "ACCEPTANCE_CONFIRMED",
    categoryName: "Financial",
    checklistItems: [
      "Check deposit amount and deadline",
      "Arrange payment method",
      "Pay deposit before deadline",
      "Get payment receipt",
      "Submit proof of payment to school"
    ],
    helpfulLinks: []
  },
  {
    title: "Apply for Student Visa",
    description: "Begin student visa application process",
    priority: "HIGH",
    estimatedDays: 30,
    isRequired: true,
    targetStage: "ACCEPTANCE_CONFIRMED",
    categoryName: "Visa & Immigration",
    checklistItems: [
      "Get Certificate of Eligibility (COE) from school",
      "Complete visa application forms",
      "Prepare visa documents",
      "Schedule visa appointment",
      "Pay visa application fees",
      "Attend visa interview if required"
    ],
    helpfulLinks: [
      "https://www.mofa.go.jp/en/visa/index.html",
      "https://www.ph.emb-japan.go.jp/itpr_en/visa.html"
    ]
  },

  // VISA APPLICATION STAGE
  {
    title: "Prepare Financial Documents for Visa",
    description: "Prepare all financial documentation for visa",
    priority: "URGENT",
    estimatedDays: 7,
    isRequired: true,
    targetStage: "VISA_APPLICATION",
    categoryName: "Financial",
    checklistItems: [
      "Prepare bank statements",
      "Get sponsor's financial documents",
      "Prepare affidavit of support if needed",
      "Show proof of scholarship if applicable",
      "Get documents translated if necessary",
      "Make copies of all financial documents"
    ],
    helpfulLinks: []
  },
  {
    title: "Health Check-up for Visa",
    description: "Complete required medical examinations",
    priority: "HIGH",
    estimatedDays: 5,
    isRequired: true,
    targetStage: "VISA_APPLICATION",
    categoryName: "Documentation",
    checklistItems: [
      "Schedule medical examination",
      "Complete required medical tests",
      "Get health certificate from doctor",
      "Submit medical documents with visa application",
      "Keep copies of all medical records"
    ],
    helpfulLinks: []
  },

  // VISA PROCESSING STAGE
  {
    title: "Track Visa Application Status",
    description: "Monitor visa application progress",
    priority: "MEDIUM",
    estimatedDays: 45,
    isRequired: true,
    targetStage: "VISA_PROCESSING",
    categoryName: "Visa & Immigration",
    checklistItems: [
      "Check visa application status online",
      "Respond to requests for additional documents",
      "Stay in contact with school's international office",
      "Prepare for visa approval",
      "Plan travel timeline based on visa processing"
    ],
    helpfulLinks: []
  },

  // VISA APPROVED STAGE
  {
    title: "Receive and Verify Visa",
    description: "Receive and verify visa approval",
    priority: "URGENT",
    estimatedDays: 3,
    isRequired: true,
    targetStage: "VISA_APPROVED",
    categoryName: "Visa & Immigration",
    checklistItems: [
      "Receive visa approval notice",
      "Collect visa sticker in passport",
      "Verify visa details are correct",
      "Check visa validity dates",
      "Make copies of visa and passport",
      "Share visa approval with school"
    ],
    helpfulLinks: []
  },

  // PRE-DEPARTURE STAGE
  {
    title: "Book Flight Tickets",
    description: "Book flight tickets to Japan",
    priority: "HIGH",
    estimatedDays: 7,
    isRequired: true,
    targetStage: "PRE_DEPARTURE",
    categoryName: "Travel & Accommodation",
    checklistItems: [
      "Research flight options and prices",
      "Check baggage allowance policies",
      "Book flights with arrival before school start",
      "Choose refundable tickets if possible",
      "Get travel insurance",
      "Share flight details with school and family"
    ],
    helpfulLinks: [
      "https://www.jal.co.jp/en/",
      "https://www.ana.co.jp/en/",
      "https://www.skyscanner.net/"
    ]
  },
  {
    title: "Arrange Accommodation",
    description: "Secure accommodation in Japan",
    priority: "URGENT",
    estimatedDays: 14,
    isRequired: true,
    targetStage: "PRE_DEPARTURE",
    categoryName: "Travel & Accommodation",
    checklistItems: [
      "Apply for school dormitory if available",
      "Research off-campus housing options",
      "Contact housing agencies in Japan",
      "Sign lease agreement",
      "Pay deposit and first month rent",
      "Get accommodation details and address"
    ],
    helpfulLinks: [
      "https://www.o-hayo-ichi.com/",
      "https://www.realestate-tokyo.com/"
    ]
  },
  {
    title: "Arrange Airport Pickup",
    description: "Arrange transportation from airport",
    priority: "HIGH",
    estimatedDays: 7,
    isRequired: true,
    targetStage: "PRE_DEPARTURE",
    categoryName: "Travel & Accommodation",
    checklistItems: [
      "Check if school offers airport pickup",
      "Arrange taxi or shuttle service",
      "Share flight details with pickup service",
      "Have backup transportation plan",
      "Save emergency contact numbers"
    ],
    helpfulLinks: []
  },

  // FLIGHT BOOKING STAGE
  {
    title: "Finalize Travel Arrangements",
    description: "Complete all travel preparations",
    priority: "HIGH",
    estimatedDays: 3,
    isRequired: true,
    targetStage: "FLIGHT_BOOKING",
    categoryName: "Travel & Accommodation",
    checklistItems: [
      "Confirm flight booking details",
      "Check visa and passport validity",
      "Arrange travel to departure airport",
      "Pack carry-on luggage",
      "Prepare travel documents folder",
      "Exchange currency for Japan"
    ],
    helpfulLinks: []
  },

  // ACCOMMODATION SETUP STAGE
  {
    title: "Prepare for Move-in",
    description: "Prepare for moving into accommodation",
    priority: "HIGH",
    estimatedDays: 5,
    isRequired: true,
    targetStage: "ACCOMMODATION_SETUP",
    categoryName: "Travel & Accommodation",
    checklistItems: [
      "Contact accommodation manager",
      "Confirm move-in date and time",
      "Arrange payment of rent/deposit",
      "Get accommodation rules and guidelines",
      "Prepare necessary documents for check-in"
    ],
    helpfulLinks: []
  },

  // PACKING PREPARATION STAGE
  {
    title: "Create Packing List",
    description: "Create comprehensive packing list",
    priority: "HIGH",
    estimatedDays: 3,
    isRequired: true,
    targetStage: "PACKING_PREPARATION",
    categoryName: "Pre-Departure",
    checklistItems: [
      "Research Japan weather and climate",
      "List essential clothing items",
      "Plan for electronics and adapters",
      "Include personal items and mementos",
      "Check airline baggage restrictions",
      "Create separate lists for carry-on and checked baggage"
    ],
    helpfulLinks: [
      "https://www.japan-guide.com/e/e2275.html"
    ]
  },
  {
    title: "Pack Luggage",
    description: "Pack all necessary items",
    priority: "HIGH",
    estimatedDays: 5,
    isRequired: true,
    targetStage: "PACKING_PREPARATION",
    categoryName: "Pre-Departure",
    checklistItems: [
      "Pack clothing appropriate for season",
      "Pack toiletries and personal care items",
      "Pack electronics and chargers",
      "Pack important documents in carry-on",
      "Pack some familiar items from home",
      "Weigh luggage to avoid excess fees"
    ],
    helpfulLinks: []
  },
  {
    title: "Final Preparations",
    description: "Complete all final preparations",
    priority: "URGENT",
    estimatedDays: 2,
    isRequired: true,
    targetStage: "PACKING_PREPARATION",
    categoryName: "Pre-Departure",
    checklistItems: [
      "Inform bank about travel plans",
      "Set up international phone plan",
      "Download useful apps for Japan",
      "Print important documents",
      "Prepare emergency contact list",
      "Say goodbye to family and friends"
    ],
    helpfulLinks: [
      "https://apps.apple.com/us/app/google-translate/id531349291",
      "https://play.google.com/store/apps/details?id=com.google.android.apps.translate"
    ]
  },

  // DEPARTURE STAGE
  {
    title: "Travel to Airport",
    description: "Travel to departure airport",
    priority: "URGENT",
    estimatedDays: 1,
    isRequired: true,
    targetStage: "DEPARTURE",
    categoryName: "Travel & Accommodation",
    checklistItems: [
      "Check flight status before leaving",
      "Arrive at airport 3 hours early",
      "Complete check-in process",
      "Go through security and immigration",
      "Find departure gate",
      "Board flight to Japan"
    ],
    helpfulLinks: []
  },

  // POST_ARRIVAL STAGE
  {
    title: "Complete Immigration in Japan",
    description: "Complete arrival procedures in Japan",
    priority: "URGENT",
    estimatedDays: 1,
    isRequired: true,
    targetStage: "POST_ARRIVAL",
    categoryName: "Visa & Immigration",
    checklistItems: [
      "Go through immigration at Japanese airport",
      "Show passport and visa",
      "Get residence card at airport",
      "Complete arrival card",
      "Collect luggage",
      "Clear customs"
    ],
    helpfulLinks: [
      "https://www.immi-moj.go.jp/"
    ]
  },
  {
    title: "Check into Accommodation",
    description: "Check into arranged accommodation",
    priority: "HIGH",
    estimatedDays: 1,
    isRequired: true,
    targetStage: "POST_ARRIVAL",
    categoryName: "Travel & Accommodation",
    checklistItems: [
      "Travel to accommodation",
      "Meet with landlord/manager",
      "Complete check-in procedures",
      "Pay any remaining fees",
      "Get keys and access information",
      "Inspect accommodation condition"
    ],
    helpfulLinks: []
  },
  {
    title: "Register at Local Authorities",
    description: "Complete local registration requirements",
    priority: "HIGH",
    estimatedDays: 7,
    isRequired: true,
    targetStage: "POST_ARRIVAL",
    categoryName: "Visa & Immigration",
    checklistItems: [
      "Register address at local city office",
      "Get My Number card if required",
      "Register for national health insurance",
      "Open Japanese bank account",
      "Get Japanese phone number",
      "Register with school international office"
    ],
    helpfulLinks: [
      "https://www.cas.go.jp/jp/seisaku/juminhyo/",
      "https://www.mhlw.go.jp/english/"
    ]
  },
  {
    title: "Settle into School Life",
    description: "Complete school registration and orientation",
    priority: "HIGH",
    estimatedDays: 3,
    isRequired: true,
    targetStage: "POST_ARRIVAL",
    categoryName: "Application Process",
    checklistItems: [
      "Attend school orientation",
      "Complete school registration",
      "Get student ID card",
      "Tour campus facilities",
      "Meet with academic advisor",
      "Join student clubs or activities"
    ],
    helpfulLinks: []
  }
];

// This script will be used to seed the database via API calls
// For now, let's just export the data to be used by the API
console.log("📋 Todo Categories and Templates ready for seeding");
console.log(`Categories: ${TODO_CATEGORIES.length}`);
console.log(`Templates: ${TODO_TEMPLATES.length}`);

module.exports = {
  TODO_CATEGORIES,
  TODO_TEMPLATES
};
