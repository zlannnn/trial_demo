-- Idempotent: ensure conversation-scoped policy columns exist (Neon / fresh DBs)
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "policyholderName" TEXT;
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "birthday" DATE;
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "insuredName" TEXT;
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "annualPremium" TEXT;
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "paymentYears" TEXT;
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "coverageUntilAge" TEXT;
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "beneficiary" TEXT;
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "contractConfirmedAt" TIMESTAMP(3);

ALTER TABLE "function_call_logs" ADD COLUMN IF NOT EXISTS "conversationId" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'function_call_logs_conversationId_fkey'
  ) THEN
    ALTER TABLE "function_call_logs"
      ADD CONSTRAINT "function_call_logs_conversationId_fkey"
      FOREIGN KEY ("conversationId") REFERENCES "conversations"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "function_call_logs_conversationId_createdAt_idx"
  ON "function_call_logs"("conversationId", "createdAt" DESC);
