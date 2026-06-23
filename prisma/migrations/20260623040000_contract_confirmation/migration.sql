-- AlterTable
ALTER TABLE "user_profiles" ADD COLUMN     "insuredName" TEXT,
ADD COLUMN     "annualPremium" TEXT,
ADD COLUMN     "paymentYears" TEXT,
ADD COLUMN     "coverageUntilAge" TEXT,
ADD COLUMN     "beneficiary" TEXT,
ADD COLUMN     "contractConfirmedAt" TIMESTAMP(3);
