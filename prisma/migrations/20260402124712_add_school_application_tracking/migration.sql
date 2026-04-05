/*
  Warnings:

  - The `status` column on the `applications` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'SUBMITTED', 'ACCEPTED', 'REJECTED', 'WAITLISTED', 'WITHDRAWN');

-- AlterTable
ALTER TABLE "applications" ADD COLUMN     "responseDate" TIMESTAMP(3),
ADD COLUMN     "responseNotes" TEXT,
ADD COLUMN     "submittedAt" TIMESTAMP(3),
ADD COLUMN     "submittedBy" TEXT,
DROP COLUMN "status",
ADD COLUMN     "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "schools" ADD COLUMN     "isPartner" BOOLEAN NOT NULL DEFAULT false;
