/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `students` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId]` on the table `students` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "StudentCategory" AS ENUM ('VISITOR', 'PROSPECT', 'APPLIED', 'COMMITTED', 'ENROLLED', 'ALUMNI');

-- AlterTable
ALTER TABLE "students" ADD COLUMN     "category" "StudentCategory" NOT NULL DEFAULT 'VISITOR',
ADD COLUMN     "categoryUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "email" TEXT,
ADD COLUMN     "hasLoginAccess" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "loginSentAt" TIMESTAMP(3),
ADD COLUMN     "userId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "students_email_key" ON "students"("email");

-- CreateIndex
CREATE UNIQUE INDEX "students_userId_key" ON "students"("userId");

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
