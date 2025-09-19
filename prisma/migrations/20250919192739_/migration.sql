/*
  Warnings:

  - You are about to drop the column `remainingLoanPrincipal` on the `ProjectedData` table. All the data in the column will be lost.
  - You are about to drop the column `totalLoanPayment` on the `ProjectedData` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."ProjectedData" DROP COLUMN "remainingLoanPrincipal",
DROP COLUMN "totalLoanPayment",
ADD COLUMN     "remainingLoanPrincipalTotal" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "public"."ProjectedLoanState" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "principalPaid" DOUBLE PRECISION,
    "interestPaid" DOUBLE PRECISION,
    "remainingPrincipal" DOUBLE PRECISION,
    "profileId" TEXT NOT NULL,
    "loanId" TEXT NOT NULL,
    "projectedDataId" TEXT NOT NULL,

    CONSTRAINT "ProjectedLoanState_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProjectedLoanState_projectedDataId_loanId_key" ON "public"."ProjectedLoanState"("projectedDataId", "loanId");

-- AddForeignKey
ALTER TABLE "public"."ProjectedLoanState" ADD CONSTRAINT "ProjectedLoanState_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "public"."FinancialProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProjectedLoanState" ADD CONSTRAINT "ProjectedLoanState_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "public"."Loan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProjectedLoanState" ADD CONSTRAINT "ProjectedLoanState_projectedDataId_fkey" FOREIGN KEY ("projectedDataId") REFERENCES "public"."ProjectedData"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
