-- Idempotent recovery: ensure conversation tables exist on production DBs
-- that missed the initial migration (e.g. pooled-connection migrate failures).

CREATE TABLE IF NOT EXISTS "conversations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "messages" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" "MessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "policyholderName" TEXT;
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "birthday" DATE;
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "insuredName" TEXT;
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "annualPremium" TEXT;
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "paymentYears" TEXT;
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "coverageUntilAge" TEXT;
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "beneficiary" TEXT;
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "contractConfirmedAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "conversations_userId_startedAt_idx"
  ON "conversations"("userId", "startedAt" DESC);

CREATE INDEX IF NOT EXISTS "messages_conversationId_createdAt_idx"
  ON "messages"("conversationId", "createdAt" ASC);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'conversations_userId_fkey'
  ) THEN
    ALTER TABLE "conversations"
      ADD CONSTRAINT "conversations_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'messages_conversationId_fkey'
  ) THEN
    ALTER TABLE "messages"
      ADD CONSTRAINT "messages_conversationId_fkey"
      FOREIGN KEY ("conversationId") REFERENCES "conversations"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
