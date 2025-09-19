/*
  Warnings:

  - Made the column `paymentMethod` on table `Loan` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."Loan" ALTER COLUMN "paymentMethod" SET NOT NULL;
