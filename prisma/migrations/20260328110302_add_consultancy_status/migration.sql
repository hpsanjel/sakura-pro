-- CreateEnum
CREATE TYPE "ConsultancyStatus" AS ENUM ('PENDING', 'ACTIVE', 'REJECTED');

-- AlterTable
ALTER TABLE "consultancies" ADD COLUMN     "status" "ConsultancyStatus" NOT NULL DEFAULT 'PENDING';
