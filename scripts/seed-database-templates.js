const { PrismaClient } = require('../src/generated/prisma/client');

const prisma = new PrismaClient();

// Templates that match the database categories
const DATABASE_TEMPLATES = [
  // Accommodation
  {
    title: "Apply for Student Accommodation",
    description: "Complete and submit student housing application",
    priority: "HIGH",
    estimatedDays: 5,
    categoryName: "Accommodation",
    checklistItems: [
      "Research available accommodation options",
      "Complete housing application form", 
      "Submit required documents",
      "Pay accommodation deposit",
      "Sign housing contract",
      "Confirm move-in date"
    ],
    helpfulLinks: ["https://www.studyjapan.go.jp/en/"],
    counselorNotes: "Student dormitories fill up quickly, apply early"
  },
  {
    title: "Prepare Housing Documents",
    description: "Gather all documents required for rental accommodation",
    priority: "MEDIUM", 
    estimatedDays: 3,
    categoryName: "Accommodation",
    checklistItems: [
      "Prepare guarantor documents",
      "Get proof of scholarship/funding",
      "Fill rental application forms",
      "Prepare emergency contact info",
      "Translate documents if needed"
    ],
    helpfulLinks: [],
    counselorNotes: "Japanese rental requirements can be complex, start early"
  },

  // Application Documents
  {
    title: "Submit Passport Copy",
    description: "Provide a clear scanned copy of your passport for university application",
    priority: "HIGH",
    estimatedDays: 2,
    categoryName: "Application Documents",
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
    title: "Submit Academic Transcripts",
    description: "Provide official academic transcripts and certificates from previous education",
    priority: "HIGH",
    estimatedDays: 7,
    categoryName: "Application Documents", 
    checklistItems: [
      "Request official transcripts from school",
      "Get English translations if needed",
      "Obtain graduation certificates",
      "Scan all documents clearly",
      "Upload with proper naming convention"
    ],
    helpfulLinks: [],
    counselorNotes: "Some universities may require transcripts in sealed envelopes directly from school"
  },

  // Communication
  {
    title: "Contact University International Office",
    description: "Establish communication with the university's international student office",
    priority: "MEDIUM",
    estimatedDays: 2,
    categoryName: "Communication",
    checklistItems: [
      "Find international office contact information",
      "Send introduction email",
      "Ask about pre-arrival requirements",
      "Set up communication channel",
      "Save important contact details"
    ],
    helpfulLinks: [],
    counselorNotes: "Good communication with the university can help resolve issues quickly"
  },

  // Financial Documents
  {
    title: "Submit Bank Statement",
    description: "Provide recent bank statement showing sufficient funds for studies",
    priority: "HIGH",
    estimatedDays: 3,
    categoryName: "Financial Documents",
    checklistItems: [
      "Get statement from last 6 months",
      "Ensure sufficient balance is shown",
      "Translate if not in English/Japanese",
      "Get bank verification letter",
      "Scan and upload clearly"
    ],
    helpfulLinks: [],
    counselorNotes: "Balance should cover tuition + living expenses for first year"
  },
  {
    title: "Pay Tuition Deposit",
    description: "Pay the required tuition deposit to secure admission",
    priority: "URGENT",
    estimatedDays: 3,
    categoryName: "Financial Documents",
    checklistItems: [
      "Check payment deadline",
      "Confirm payment amount and method",
      "Arrange for international transfer",
      "Get payment receipt",
      "Submit receipt to university",
      "Keep copy for records"
    ],
    helpfulLinks: [],
    counselorNotes: "Late payment may result in admission cancellation"
  },

  // Health & Medical
  {
    title: "Get Medical Certificate",
    description: "Obtain medical certificate as required by university/visa",
    priority: "MEDIUM",
    estimatedDays: 5,
    categoryName: "Health & Medical",
    checklistItems: [
      "Schedule doctor appointment",
      "Take medical form to doctor",
      "Complete required medical tests",
      "Get doctor's signature and stamp",
      "Translate if not in English",
      "Submit to university"
    ],
    helpfulLinks: [],
    counselorNotes: "Some universities have specific medical forms that must be used"
  },

  // Language Preparation
  {
    title: "Register for JLPT Exam",
    description: "Register for Japanese Language Proficiency Test if required",
    priority: "MEDIUM",
    estimatedDays: 2,
    categoryName: "Language Preparation",
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
    title: "Create Japanese Study Plan",
    description: "Develop a structured plan for Japanese language learning",
    priority: "MEDIUM",
    estimatedDays: 3,
    categoryName: "Language Preparation",
    checklistItems: [
      "Assess current Japanese level",
      "Set target proficiency level",
      "Create daily study schedule",
      "Choose study materials/textbooks",
      "Plan practice with native speakers",
      "Set milestones and deadlines"
    ],
    helpfulLinks: ["https://www.marugoto.org/"],
    counselorNotes: "Consistent daily practice is more effective than cramming"
  },

  // Pre-Departure
  {
    title: "Book Flight to Japan",
    description: "Book international flight to Japan with appropriate dates",
    priority: "MEDIUM",
    estimatedDays: 5,
    categoryName: "Pre-Departure",
    checklistItems: [
      "Check visa processing timeline",
      "Compare flight prices and airlines",
      "Book flexible ticket if possible",
      "Check baggage allowance",
      "Arrive 1-2 weeks before orientation",
      "Share flight details with university"
    ],
    helpfulLinks: ["https://www.skyscanner.com/"],
    counselorNotes: "Don't book flights until visa is approved"
  },
  {
    title: "Prepare Luggage Packing",
    description: "Pack essential items for living and studying in Japan",
    priority: "LOW",
    estimatedDays: 7,
    categoryName: "Pre-Departure",
    checklistItems: [
      "Check airline baggage limits",
      "Pack essential documents separately",
      "Include appropriate clothing for season",
      "Pack electronics and adapters",
      "Bring some local currency",
      "Prepare medications with prescriptions"
    ],
    helpfulLinks: [],
    counselorNotes: "Pack light but don't forget essentials that might be hard to find in Japan"
  },

  // Visa Preparation
  {
    title: "Complete Visa Application Form",
    description: "Fill out the Japanese student visa application form accurately",
    priority: "HIGH",
    estimatedDays: 3,
    categoryName: "Visa Preparation",
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
    title: "Submit Visa Photos",
    description: "Provide passport-sized photos meeting Japanese visa requirements",
    priority: "MEDIUM",
    estimatedDays: 2,
    categoryName: "Visa Preparation",
    checklistItems: [
      "Check photo specifications (45mm x 35mm)",
      "Visit professional photo studio",
      "Wear formal attire (no uniforms)",
      "Ensure plain white background",
      "Get 2-3 recent photos",
      "Photos must be within 6 months"
    ],
    helpfulLinks: [],
    counselorNotes: "Selfies or casual photos will not be accepted"
  }
];

async function seedDatabaseTemplates() {
  console.log("🌱 Starting to seed database templates...");

  try {
    // Get the first consultancy
    let consultancy = await prisma.consultancy.findFirst();
    
    if (!consultancy) {
      console.log("⚠️ No consultancy found. Please create a consultancy first.");
      return;
    }

    console.log(`📋 Using consultancy: ${consultancy.name}`);

    // Get all categories for this consultancy
    const categories = await prisma.todoCategory.findMany({
      where: {
        consultancyId: consultancy.id
      }
    });

    console.log(`📊 Found ${categories.length} categories`);

    // Create templates for each category
    let createdTemplates = 0;
    
    for (const templateData of DATABASE_TEMPLATES) {
      // Find the category by name
      const category = categories.find(c => c.name === templateData.categoryName);
      
      if (!category) {
        console.error(`❌ Category not found: ${templateData.categoryName}`);
        continue;
      }

      // Check if template already exists
      const existingTemplate = await prisma.todoTemplate.findFirst({
        where: {
          consultancyId: consultancy.id,
          categoryId: category.id,
          title: templateData.title
        }
      });

      if (existingTemplate) {
        console.log(`⚠️ Template already exists: ${templateData.title}`);
        continue;
      }

      // Create the template
      const template = await prisma.todoTemplate.create({
        data: {
          consultancyId: consultancy.id,
          categoryId: category.id,
          title: templateData.title,
          description: templateData.description,
          priority: templateData.priority,
          estimatedDays: templateData.estimatedDays,
          isRequired: true,
          dependencies: [],
          checklistItems: templateData.checklistItems,
          helpfulLinks: templateData.helpfulLinks,
          targetStage: "INITIAL_ENQUIRY", // Default stage
          isActive: true
        }
      });

      console.log(`✅ Created template: ${template.title} (Category: ${category.name})`);
      createdTemplates++;
    }

    console.log(`🎉 Template seeding completed!`);
    console.log(`📊 Created ${createdTemplates} new templates`);

    // Show summary
    const totalTemplates = await prisma.todoTemplate.count({
      where: {
        consultancyId: consultancy.id
      }
    });

    const templatesByCategory = await prisma.todoTemplate.groupBy({
      by: ['categoryId'],
      where: {
        consultancyId: consultancy.id
      },
      _count: {
        id: true
      }
    });

    console.log(`📈 Final template count: ${totalTemplates}`);
    
    // Show templates per category
    for (const category of categories) {
      const templateCount = templatesByCategory.find(t => t.categoryId === category.id)?._count.id || 0;
      console.log(`   - ${category.name}: ${templateCount} templates`);
    }

  } catch (error) {
    console.error("❌ Error seeding templates:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding function
seedDatabaseTemplates()
  .then(() => {
    console.log("✨ Template seeding completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Template seeding failed:", error);
    process.exit(1);
  });
