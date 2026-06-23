-- AlterTable: per-conversation contract confirmation fields
ALTER TABLE "conversations" ADD COLUMN     "policyholderName" TEXT,
ADD COLUMN     "birthday" DATE,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "insuredName" TEXT,
ADD COLUMN     "annualPremium" TEXT,
ADD COLUMN     "paymentYears" TEXT,
ADD COLUMN     "coverageUntilAge" TEXT,
ADD COLUMN     "beneficiary" TEXT,
ADD COLUMN     "contractConfirmedAt" TIMESTAMP(3);
