/*
  Warnings:

  - A unique constraint covering the columns `[employeeId]` on the table `teachers` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "TeacherStatus" AS ENUM ('APPLICANT', 'SCREENING', 'INTERVIEW', 'OFFERED', 'HIRED', 'PROBATION', 'ACTIVE', 'ON_LEAVE', 'TERMINATED');

-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'FREELANCE');

-- CreateEnum
CREATE TYPE "TeacherDocumentType" AS ENUM ('CV', 'COVER_LETTER', 'CERTIFICATE', 'DEGREE', 'TRANSCRIPT', 'PASSPORT', 'VISA', 'CONTRACT', 'POLICE_CLEARANCE', 'HEALTH_CERT', 'PHOTO_ID', 'OTHER');

-- AlterTable - Add new columns as nullable first
ALTER TABLE "teachers" ADD COLUMN     "address" TEXT,
ADD COLUMN     "bankAccount" TEXT,
ADD COLUMN     "certifications" TEXT,
ADD COLUMN     "contractEndDate" TIMESTAMP(3),
ADD COLUMN     "currency" TEXT DEFAULT 'USD',
ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "emergencyContact" TEXT,
ADD COLUMN     "employeeId" TEXT,
ADD COLUMN     "employmentType" "EmploymentType" DEFAULT 'FULL_TIME',
ADD COLUMN     "firstName" TEXT,
ADD COLUMN     "gender" TEXT,
ADD COLUMN     "healthInsurance" BOOLEAN DEFAULT false,
ADD COLUMN     "hireDate" TIMESTAMP(3),
ADD COLUMN     "housingAllowance" DOUBLE PRECISION,
ADD COLUMN     "languages" TEXT,
ADD COLUMN     "lastName" TEXT,
ADD COLUMN     "lastReviewDate" TIMESTAMP(3),
ADD COLUMN     "linkedinProfile" TEXT,
ADD COLUMN     "mealAllowance" DOUBLE PRECISION,
ADD COLUMN     "nationality" TEXT,
ADD COLUMN     "otherBenefits" TEXT,
ADD COLUMN     "performanceRating" TEXT,
ADD COLUMN     "personalEmail" TEXT,
ADD COLUMN     "phoneNumber" TEXT,
ADD COLUMN     "probationEndDate" TIMESTAMP(3),
ADD COLUMN     "salary" DOUBLE PRECISION,
ADD COLUMN     "skills" TEXT,
ADD COLUMN     "status" "TeacherStatus" DEFAULT 'APPLICANT',
ADD COLUMN     "taxId" TEXT,
ADD COLUMN     "teachingExperience" TEXT,
ADD COLUMN     "trainingCompleted" TEXT,
ADD COLUMN     "transportAllowance" DOUBLE PRECISION,
ADD COLUMN     "workEmail" TEXT;

-- Populate firstName and lastName for existing records
UPDATE "teachers" 
SET "firstName" = COALESCE(
  (SELECT SPLIT_PART(u.name, ' ', 1) FROM "users" u WHERE u.id = "teachers"."userId" AND u.name IS NOT NULL),
  'Unknown'
),
"lastName" = COALESCE(
  CASE 
    WHEN (SELECT SPLIT_PART(u.name, ' ', 2) FROM "users" u WHERE u.id = "teachers"."userId" AND u.name IS NOT NULL) != '' 
    THEN (SELECT SPLIT_PART(u.name, ' ', 2) FROM "users" u WHERE u.id = "teachers"."userId" AND u.name IS NOT NULL)
    ELSE 'Teacher'
  END,
  'Teacher'
);

-- Now make the columns NOT NULL
ALTER TABLE "teachers" ALTER COLUMN "firstName" SET NOT NULL,
ALTER COLUMN "lastName" SET NOT NULL,
ALTER COLUMN "employmentType" SET NOT NULL,
ALTER COLUMN "status" SET NOT NULL;

-- CreateTable
CREATE TABLE "teacher_documents" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "type" "TeacherDocumentType" NOT NULL,
    "title" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "status" "DocumentStatus" NOT NULL DEFAULT 'UPLOADED',
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploadedBy" TEXT NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "notes" TEXT,
    "expiryDate" TIMESTAMP(3),

    CONSTRAINT "teacher_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payslips" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "payPeriod" TEXT NOT NULL,
    "basicSalary" DOUBLE PRECISION NOT NULL,
    "housingAllow" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "transportAllow" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "mealAllow" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "otherAllow" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "grossSalary" DOUBLE PRECISION NOT NULL,
    "taxDeduction" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "insuranceDed" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "otherDed" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netSalary" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "payDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),

    CONSTRAINT "payslips_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "teachers_employeeId_key" ON "teachers"("employeeId");

-- AddForeignKey
ALTER TABLE "teacher_documents" ADD CONSTRAINT "teacher_documents_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
