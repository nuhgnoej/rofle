-- CreateEnum
CREATE TYPE "public"."ConsumptionType" AS ENUM ('AMOUNT', 'PERCENTAGE');

-- CreateTable
CREATE TABLE "public"."FinancialProfile" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "dob" TIMESTAMP(3),
    "retirementAge" INTEGER,
    "peakWagePeriod" INTEGER,
    "peakWageReductionRate" DOUBLE PRECISION,
    "consumptionType" "public"."ConsumptionType" NOT NULL DEFAULT 'AMOUNT',
    "monthlyConsumptionValue" DOUBLE PRECISION,
    "monthlyInsurance" DOUBLE PRECISION,
    "monthlySavings" DOUBLE PRECISION,
    "monthlyRepayment" DOUBLE PRECISION,

    CONSTRAINT "FinancialProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MonthlyIncome" (
    "id" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "income" DOUBLE PRECISION NOT NULL,
    "bonus" DOUBLE PRECISION NOT NULL,
    "profileId" TEXT NOT NULL,

    CONSTRAINT "MonthlyIncome_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Loan" (
    "id" TEXT NOT NULL,
    "principal" DOUBLE PRECISION NOT NULL,
    "interestRate" DOUBLE PRECISION NOT NULL,
    "profileId" TEXT NOT NULL,

    CONSTRAINT "Loan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyIncome_profileId_month_key" ON "public"."MonthlyIncome"("profileId", "month");

-- AddForeignKey
ALTER TABLE "public"."MonthlyIncome" ADD CONSTRAINT "MonthlyIncome_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "public"."FinancialProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Loan" ADD CONSTRAINT "Loan_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "public"."FinancialProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
