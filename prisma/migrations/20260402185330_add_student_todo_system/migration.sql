-- CreateEnum
CREATE TYPE "TodoPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "TodoStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'OVERDUE', 'BLOCKED');

-- CreateEnum
CREATE TYPE "StudentJourneyStage" AS ENUM ('INITIAL_ENQUIRY', 'DOCUMENTATION', 'APPLICATION_SUBMITTED', 'APPLICATION_PROCESSING', 'OFFER_RECEIVED', 'ACCEPTANCE_CONFIRMED', 'VISA_APPLICATION', 'VISA_PROCESSING', 'VISA_APPROVED', 'PRE_DEPARTURE', 'FLIGHT_BOOKING', 'ACCOMMODATION_SETUP', 'PACKING_PREPARATION', 'DEPARTURE', 'POST_ARRIVAL');

-- CreateTable
CREATE TABLE "todo_categories" (
    "id" TEXT NOT NULL,
    "consultancyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT NOT NULL DEFAULT '#3B82F6',
    "icon" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "todo_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "todo_templates" (
    "id" TEXT NOT NULL,
    "consultancyId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priority" "TodoPriority" NOT NULL DEFAULT 'MEDIUM',
    "estimatedDays" INTEGER,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "dependencies" TEXT[],
    "checklistItems" TEXT[],
    "helpfulLinks" TEXT[],
    "targetStage" "StudentJourneyStage" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "todo_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_todos" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "consultancyId" TEXT NOT NULL,
    "templateId" TEXT,
    "categoryId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priority" "TodoPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "TodoStatus" NOT NULL DEFAULT 'PENDING',
    "dueDate" TIMESTAMP(3),
    "assignedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedDate" TIMESTAMP(3),
    "assignedBy" TEXT,
    "completedBy" TEXT,
    "notes" TEXT,
    "counselorNotes" TEXT,
    "attachments" TEXT[],
    "helpfulLinks" TEXT[],
    "estimatedDays" INTEGER,
    "actualDays" INTEGER,
    "isOverdue" BOOLEAN NOT NULL DEFAULT false,
    "reminderSent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_todos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "todo_checklist_items" (
    "id" TEXT NOT NULL,
    "todoId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "todo_checklist_items_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "todo_categories" ADD CONSTRAINT "todo_categories_consultancyId_fkey" FOREIGN KEY ("consultancyId") REFERENCES "consultancies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "todo_templates" ADD CONSTRAINT "todo_templates_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "todo_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "todo_templates" ADD CONSTRAINT "todo_templates_consultancyId_fkey" FOREIGN KEY ("consultancyId") REFERENCES "consultancies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_todos" ADD CONSTRAINT "student_todos_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_todos" ADD CONSTRAINT "student_todos_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "todo_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_todos" ADD CONSTRAINT "student_todos_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "todo_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_todos" ADD CONSTRAINT "student_todos_consultancyId_fkey" FOREIGN KEY ("consultancyId") REFERENCES "consultancies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "todo_checklist_items" ADD CONSTRAINT "todo_checklist_items_todoId_fkey" FOREIGN KEY ("todoId") REFERENCES "student_todos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
