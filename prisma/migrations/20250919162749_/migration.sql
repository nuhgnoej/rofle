-- AlterTable
ALTER TABLE "public"."Loan" ADD COLUMN     "paymentMethod" TEXT;

-- AlterTable
ALTER TABLE "public"."ProjectedData" ADD COLUMN     "familyMembers" JSONB,
ADD COLUMN     "name" TEXT;
