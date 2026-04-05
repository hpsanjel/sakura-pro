-- CreateEnum
CREATE TYPE "EmployeeStatus" AS ENUM ('APPLICANT', 'SCREENING', 'INTERVIEW', 'OFFERED', 'HIRED', 'PROBATION', 'ACTIVE', 'ON_LEAVE', 'TERMINATED');

-- CreateEnum
CREATE TYPE "EmployeeCategory" AS ENUM ('ADMINISTRATION', 'MARKETING', 'LANGUAGE', 'COUNSELORS', 'IT', 'FINANCE', 'HR', 'OPERATIONS', 'MANAGEMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "EmployeeDocumentType" AS ENUM ('CV', 'COVER_LETTER', 'CERTIFICATE', 'DEGREE', 'TRANSCRIPT', 'PASSPORT', 'VISA', 'CONTRACT', 'POLICE_CLEARANCE', 'HEALTH_CERT', 'PHOTO_ID', 'OTHER');

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'EMPLOYEE';

-- CreateTable
CREATE TABLE "employees" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "consultancyId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "gender" TEXT,
    "nationality" TEXT,
    "phoneNumber" TEXT,
    "address" TEXT,
    "emergencyContact" TEXT,
    "designation" TEXT NOT NULL,
    "department" TEXT,
    "category" "EmployeeCategory" NOT NULL,
    "experience" TEXT,
    "qualifications" TEXT,
    "skills" TEXT,
    "previousCompanies" TEXT,
    "employeeId" TEXT,
    "status" "EmployeeStatus" NOT NULL DEFAULT 'APPLICANT',
    "employmentType" "EmploymentType" NOT NULL DEFAULT 'FULL_TIME',
    "hireDate" TIMESTAMP(3),
    "probationEndDate" TIMESTAMP(3),
    "contractEndDate" TIMESTAMP(3),
    "salary" DOUBLE PRECISION,
    "currency" TEXT DEFAULT 'USD',
    "bankAccount" TEXT,
    "taxId" TEXT,
    "healthInsurance" BOOLEAN NOT NULL DEFAULT false,
    "housingAllowance" DOUBLE PRECISION,
    "transportAllowance" DOUBLE PRECISION,
    "mealAllowance" DOUBLE PRECISION,
    "otherBenefits" TEXT,
    "performanceRating" TEXT,
    "lastReviewDate" TIMESTAMP(3),
    "trainingCompleted" TEXT,
    "certifications" TEXT,
    "workEmail" TEXT,
    "personalEmail" TEXT,
    "linkedinProfile" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_documents" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "type" "EmployeeDocumentType" NOT NULL,
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

    CONSTRAINT "employee_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_payslips" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
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

    CONSTRAINT "employee_payslips_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "employees_userId_key" ON "employees"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "employees_employeeId_key" ON "employees"("employeeId");

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_consultancyId_fkey" FOREIGN KEY ("consultancyId") REFERENCES "consultancies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_documents" ADD CONSTRAINT "employee_documents_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_payslips" ADD CONSTRAINT "employee_payslips_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
