const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

// Common expense templates for quick setup
const COMMON_EXPENSE_TEMPLATES = [
  // Utilities
  { title: "Electricity Bill", category: "UTILITIES", suggestedAmount: 150, tags: ["monthly", "essential"] },
  { title: "Internet Bill", category: "UTILITIES", suggestedAmount: 80, tags: ["monthly", "essential"] },
  { title: "Water Bill", category: "UTILITIES", suggestedAmount: 40, tags: ["monthly", "essential"] },
  { title: "Phone Bill", category: "UTILITIES", suggestedAmount: 60, tags: ["monthly", "essential"] },
  
  // Office Supplies
  { title: "Stationery Supplies", category: "SUPPLIES", suggestedAmount: 25, tags: ["monthly", "office"] },
  { title: "Printer Paper", category: "SUPPLIES", suggestedAmount: 15, tags: ["monthly", "office"] },
  { title: "Office Cleaning", category: "MAINTENANCE", suggestedAmount: 100, tags: ["monthly", "essential"] },
  
  // Subscriptions
  { title: "Software Licenses", category: "SUBSCRIPTIONS", suggestedAmount: 50, tags: ["monthly", "software"] },
  { title: "Cloud Storage", category: "SUBSCRIPTIONS", suggestedAmount: 20, tags: ["monthly", "software"] },
  { title: "Antivirus Software", category: "SUBSCRIPTIONS", suggestedAmount: 30, tags: ["yearly", "security"] },
  
  // Marketing
  { title: "Facebook Ads", category: "MARKETING", suggestedAmount: 100, tags: ["marketing", "social"] },
  { title: "Google Ads", category: "MARKETING", suggestedAmount: 150, tags: ["marketing", "digital"] },
  { title: "Business Cards", category: "MARKETING", suggestedAmount: 50, tags: ["one-time", "marketing"] },
  
  // Banking
  { title: "Bank Transaction Fees", category: "BANKING", suggestedAmount: 10, tags: ["monthly", "banking"] },
  { title: "Credit Card Fees", category: "BANKING", suggestedAmount: 25, tags: ["yearly", "banking"] },
  
  // Other
  { title: "Coffee & Tea", category: "MISCELLANEOUS", suggestedAmount: 20, tags: ["weekly", "office"] },
  { title: "Team Lunch", category: "ENTERTAINMENT", suggestedAmount: 80, tags: ["occasional", "team"] },
  { title: "Office Snacks", category: "MISCELLANEOUS", suggestedAmount: 30, tags: ["weekly", "office"] },
];

async function initializeTemplates() {
  try {
    // Get the first consultancy (for demo purposes)
    const consultancy = await prisma.consultancy.findFirst();
    
    if (!consultancy) {
      console.log('No consultancy found. Please create a consultancy first.');
      return;
    }

    // Check if templates already exist
    const existingTemplates = await prisma.officeExpenseTemplate.count({
      where: { consultancyId: consultancy.id }
    });

    if (existingTemplates > 0) {
      console.log(`Templates already exist (${existingTemplates} found). Skipping initialization.`);
      return;
    }

    // Create common templates
    const templates = await prisma.officeExpenseTemplate.createMany({
      data: COMMON_EXPENSE_TEMPLATES.map(template => ({
        ...template,
        consultancyId: consultancy.id,
        category: template.category,
        expenseMode: "CASH",
      })),
    });

    console.log(`✅ Successfully created ${templates.count} expense templates for consultancy: ${consultancy.id}`);
    
    // Verify templates were created
    const createdTemplates = await prisma.officeExpenseTemplate.findMany({
      where: { consultancyId: consultancy.id }
    });
    
    console.log(`📋 Template verification: ${createdTemplates.length} templates found`);
    createdTemplates.forEach((template, index) => {
      console.log(`${index + 1}. ${template.title} - ${template.category} - $${template.suggestedAmount || 0}`);
    });

  } catch (error) {
    console.error('❌ Error initializing templates:', error);
  } finally {
    await prisma.$disconnect();
  }
}

initializeTemplates();
