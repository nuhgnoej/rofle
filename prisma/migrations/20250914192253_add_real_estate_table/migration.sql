-- CreateTable
CREATE TABLE "public"."RealEstateAsset" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "currentValue" DOUBLE PRECISION NOT NULL,
    "profileId" TEXT NOT NULL,

    CONSTRAINT "RealEstateAsset_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."RealEstateAsset" ADD CONSTRAINT "RealEstateAsset_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "public"."FinancialProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
