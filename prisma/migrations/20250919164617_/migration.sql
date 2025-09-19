/*
  Warnings:

  - You are about to drop the column `familyMembers` on the `ProjectedData` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `ProjectedData` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."FinancialProfile" ADD COLUMN     "familyMembers" JSONB,
ADD COLUMN     "name" TEXT,
ADD COLUMN     "summary" JSONB;

-- AlterTable
ALTER TABLE "public"."ProjectedData" DROP COLUMN "familyMembers",
DROP COLUMN "name";
