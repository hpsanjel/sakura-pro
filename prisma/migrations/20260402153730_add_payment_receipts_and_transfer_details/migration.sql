-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "receiptUrls" TEXT[],
ADD COLUMN     "transferDetails" JSONB;
