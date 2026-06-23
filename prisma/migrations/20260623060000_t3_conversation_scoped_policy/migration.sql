-- NextAuth: keep avatar column; Prisma maps User.image -> users.avatar
-- (no column rename needed)

-- Remove contract fields from user_profiles (policy data is conversation-scoped only)
ALTER TABLE "user_profiles" DROP COLUMN IF EXISTS "insuredName";
ALTER TABLE "user_profiles" DROP COLUMN IF EXISTS "annualPremium";
ALTER TABLE "user_profiles" DROP COLUMN IF EXISTS "paymentYears";
ALTER TABLE "user_profiles" DROP COLUMN IF EXISTS "coverageUntilAge";
ALTER TABLE "user_profiles" DROP COLUMN IF EXISTS "beneficiary";
ALTER TABLE "user_profiles" DROP COLUMN IF EXISTS "contractConfirmedAt";

-- Link function call logs to conversations for per-call audit
ALTER TABLE "function_call_logs" ADD COLUMN "conversationId" TEXT;

ALTER TABLE "function_call_logs"
  ADD CONSTRAINT "function_call_logs_conversationId_fkey"
  FOREIGN KEY ("conversationId") REFERENCES "conversations"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "function_call_logs_conversationId_createdAt_idx"
  ON "function_call_logs"("conversationId", "createdAt" DESC);
