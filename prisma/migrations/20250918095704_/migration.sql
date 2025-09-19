/*
  Warnings:

  - You are about to drop the column `cumulativeSaving` on the `ProjectedData` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."ProjectedData" DROP COLUMN "cumulativeSaving",
ADD COLUMN     "cumulativeSavings" DOUBLE PRECISION;
