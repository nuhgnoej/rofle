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
    "salaryInflationRate" DOUBLE PRECISION,

    CONSTRAINT "FinancialProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProjectedData" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "income" DOUBLE PRECISION,
    "monthlyConsumption" DOUBLE PRECISION,
    "endOfYearAssets" DOUBLE PRECISION,
    "isOverridden" BOOLEAN NOT NULL DEFAULT false,
    "profileId" TEXT NOT NULL,

    CONSTRAINT "ProjectedData_pkey" PRIMARY KEY ("id")
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
    "name" TEXT,
    "type" TEXT,
    "principal" DOUBLE PRECISION NOT NULL,
    "interestRate" DOUBLE PRECISION NOT NULL,
    "termInYears" INTEGER,
    "profileId" TEXT NOT NULL,

    CONSTRAINT "Loan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RealEstateAsset" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "currentValue" DOUBLE PRECISION NOT NULL,
    "profileId" TEXT NOT NULL,

    CONSTRAINT "RealEstateAsset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProjectedData_profileId_year_month_key" ON "public"."ProjectedData"("profileId", "year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyIncome_profileId_month_key" ON "public"."MonthlyIncome"("profileId", "month");

-- AddForeignKey
ALTER TABLE "public"."ProjectedData" ADD CONSTRAINT "ProjectedData_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "public"."FinancialProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MonthlyIncome" ADD CONSTRAINT "MonthlyIncome_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "public"."FinancialProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Loan" ADD CONSTRAINT "Loan_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "public"."FinancialProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RealEstateAsset" ADD CONSTRAINT "RealEstateAsset_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "public"."FinancialProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
