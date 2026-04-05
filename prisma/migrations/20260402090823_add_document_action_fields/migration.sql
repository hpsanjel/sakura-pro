-- AlterTable
ALTER TABLE "documents" ADD COLUMN     "rejectedBy" TEXT,
ADD COLUMN     "uploadedBy" TEXT,
ADD COLUMN     "verifiedBy" TEXT;
