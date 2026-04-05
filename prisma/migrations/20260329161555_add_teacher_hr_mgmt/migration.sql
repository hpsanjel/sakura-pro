/*
  Warnings:

  - Made the column `healthInsurance` on table `teachers` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "teachers" ALTER COLUMN "healthInsurance" SET NOT NULL;
