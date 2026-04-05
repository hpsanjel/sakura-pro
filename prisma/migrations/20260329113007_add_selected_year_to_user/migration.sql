/*
  Warnings:

  - The values [STARTED_LANGUAGE_CLASS,LEFT_LANGUAGE_CLASS,COMPLETED_LANGUAGE_CLASS] on the enum `VisaStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "VisaStatus_new" AS ENUM ('NEW_LEAD', 'DOCS_PENDING', 'DOCS_VERIFIED', 'SENT_TO_JAPAN', 'COE_APPLIED', 'COE_APPROVED', 'VISA_APPLIED', 'VISA_APPROVED', 'REJECTED');
ALTER TABLE "public"."students" ALTER COLUMN "visaStatus" DROP DEFAULT;
ALTER TABLE "students" ALTER COLUMN "visaStatus" TYPE "VisaStatus_new" USING ("visaStatus"::text::"VisaStatus_new");
ALTER TYPE "VisaStatus" RENAME TO "VisaStatus_old";
ALTER TYPE "VisaStatus_new" RENAME TO "VisaStatus";
DROP TYPE "public"."VisaStatus_old";
ALTER TABLE "students" ALTER COLUMN "visaStatus" SET DEFAULT 'NEW_LEAD';
COMMIT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "selectedYear" INTEGER NOT NULL DEFAULT 2024;
