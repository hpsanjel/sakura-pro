const { z } = require('zod');

// Copy the validation schema from the API
const createExpenseSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  category: z.enum(["RENT", "UTILITIES", "SALARIES", "MARKETING", "EQUIPMENT", "SUPPLIES", "MAINTENANCE", "INSURANCE", "LEGAL", "TRAINING", "TRAVEL", "ENTERTAINMENT", "SUBSCRIPTIONS", "BANKING", "TAX", "MISCELLANEOUS"]),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  expenseMode: z.enum(["CASH", "BANK_TRANSFER", "CREDIT_CARD", "DEBIT_CARD", "CHEQUE", "ONLINE_PAYMENT", "OTHER"]).default("CASH"),
  expenseDate: z.string().optional(),
  receiptUrl: z.string().url().nullable().optional().or(z.literal("")),
  reference: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).default([]),
  isRecurring: z.boolean().default(false),
  recurringType: z.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]).optional(),
  recurringEnd: z.string().optional(),
});

// Test data similar to what frontend sends
const testData = {
  title: "Test Expense",
  category: "MISCELLANEOUS",
  amount: 25.50,
  expenseMode: "CASH",
  expenseDate: "2026-04-03",
  description: "",
  reference: "",
  notes: "",
  tags: [],
  isRecurring: false,
  recurringType: "MONTHLY"
};

console.log("Testing validation schema...");
console.log("Test data:", JSON.stringify(testData, null, 2));

try {
  const result = createExpenseSchema.parse(testData);
  console.log("✅ Validation passed!");
  console.log("Parsed data:", JSON.stringify(result, null, 2));
} catch (error) {
  console.error("❌ Validation failed:");
  if (error.errors) {
    error.errors.forEach((err, index) => {
      console.error(`${index + 1}. Field: ${err.path.join('.')}, Message: ${err.message}`);
    });
  }
  console.error("Full error:", error);
}

// Test with problematic data
console.log("\n--- Testing with problematic data ---");
const problematicData = {
  title: "", // Empty title
  category: "MISCELLANEOUS",
  amount: 0, // Amount too low
  expenseMode: "CASH",
  expenseDate: "2026-04-03",
  receiptUrl: "not-a-url", // Invalid URL
  reference: "",
  notes: "",
  tags: [],
  isRecurring: false,
  recurringType: "MONTHLY"
};

try {
  const result = createExpenseSchema.parse(problematicData);
  console.log("✅ Validation passed (unexpected)");
} catch (error) {
  console.error("❌ Validation failed (expected):");
  if (error.errors) {
    error.errors.forEach((err, index) => {
      console.error(`${index + 1}. Field: ${err.path.join('.')}, Message: ${err.message}`);
    });
  }
}
