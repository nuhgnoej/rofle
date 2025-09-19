-- AlterTable
ALTER TABLE "public"."ProjectedData" ADD COLUMN     "cumulativeSaving" DOUBLE PRECISION,
ADD COLUMN     "disposableIncome" DOUBLE PRECISION,
ADD COLUMN     "loanInterestPaid" DOUBLE PRECISION,
ADD COLUMN     "loanPrincipalPaid" DOUBLE PRECISION,
ADD COLUMN     "remainingLoanPrincipal" DOUBLE PRECISION,
ADD COLUMN     "totalLoanPayment" DOUBLE PRECISION;
