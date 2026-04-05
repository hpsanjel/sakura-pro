-- CreateEnum
CREATE TYPE "OfficeExpenseCategory" AS ENUM ('RENT', 'UTILITIES', 'SALARIES', 'MARKETING', 'EQUIPMENT', 'SUPPLIES', 'MAINTENANCE', 'INSURANCE', 'LEGAL', 'TRAINING', 'TRAVEL', 'ENTERTAINMENT', 'SUBSCRIPTIONS', 'BANKING', 'TAX', 'MISCELLANEOUS');

-- CreateEnum
CREATE TYPE "ExpenseMode" AS ENUM ('CASH', 'BANK_TRANSFER', 'CREDIT_CARD', 'DEBIT_CARD', 'CHEQUE', 'ONLINE_PAYMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "RecurringType" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY');

-- CreateTable
CREATE TABLE "office_expenses" (
    "id" TEXT NOT NULL,
    "consultancyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" "OfficeExpenseCategory" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "expenseMode" "ExpenseMode" NOT NULL DEFAULT 'CASH',
    "expenseDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "receiptUrl" TEXT,
    "reference" TEXT,
    "notes" TEXT,
    "tags" TEXT[],
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurringType" "RecurringType",
    "recurringEnd" TIMESTAMP(3),
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "office_expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "office_expense_templates" (
    "id" TEXT NOT NULL,
    "consultancyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" "OfficeExpenseCategory" NOT NULL,
    "suggestedAmount" DOUBLE PRECISION,
    "expenseMode" "ExpenseMode" NOT NULL DEFAULT 'CASH',
    "isCommon" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "office_expense_templates_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "office_expenses" ADD CONSTRAINT "office_expenses_consultancyId_fkey" FOREIGN KEY ("consultancyId") REFERENCES "consultancies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "office_expense_templates" ADD CONSTRAINT "office_expense_templates_consultancyId_fkey" FOREIGN KEY ("consultancyId") REFERENCES "consultancies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
