-- Idempotent recovery for production DBs where migration history exists but schema is incomplete.

DO $$ BEGIN
  CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "MessageRole" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM', 'TOOL');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "FunctionCallStatus" AS ENUM ('SUCCESS', 'FAILED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "avatar" TEXT,
    "emailVerified" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

CREATE TABLE IF NOT EXISTS "user_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "birthday" DATE,
    "gender" "Gender",
    "phone" TEXT,
    "address" TEXT,
    "notes" TEXT,
    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

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

CREATE TABLE IF NOT EXISTS "function_call_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "functionName" TEXT NOT NULL,
    "arguments" JSONB NOT NULL,
    "result" JSONB,
    "status" "FunctionCallStatus" NOT NULL DEFAULT 'SUCCESS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "function_call_logs_pkey" PRIMARY KEY ("id")
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

ALTER TABLE "function_call_logs" ADD COLUMN IF NOT EXISTS "conversationId" TEXT;

ALTER TABLE "user_profiles" DROP COLUMN IF EXISTS "insuredName";
ALTER TABLE "user_profiles" DROP COLUMN IF EXISTS "annualPremium";
ALTER TABLE "user_profiles" DROP COLUMN IF EXISTS "paymentYears";
ALTER TABLE "user_profiles" DROP COLUMN IF EXISTS "coverageUntilAge";
ALTER TABLE "user_profiles" DROP COLUMN IF EXISTS "beneficiary";
ALTER TABLE "user_profiles" DROP COLUMN IF EXISTS "contractConfirmedAt";

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'image'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'avatar'
  ) THEN
    ALTER TABLE "users" RENAME COLUMN "image" TO "avatar";
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");
CREATE INDEX IF NOT EXISTS "accounts_userId_idx" ON "accounts"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");
CREATE UNIQUE INDEX IF NOT EXISTS "sessions_sessionToken_key" ON "sessions"("sessionToken");
CREATE INDEX IF NOT EXISTS "sessions_userId_idx" ON "sessions"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "verification_tokens_token_key" ON "verification_tokens"("token");
CREATE UNIQUE INDEX IF NOT EXISTS "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");
CREATE UNIQUE INDEX IF NOT EXISTS "user_profiles_userId_key" ON "user_profiles"("userId");
CREATE INDEX IF NOT EXISTS "conversations_userId_startedAt_idx" ON "conversations"("userId", "startedAt" DESC);
CREATE INDEX IF NOT EXISTS "messages_conversationId_createdAt_idx" ON "messages"("conversationId", "createdAt" ASC);
CREATE INDEX IF NOT EXISTS "function_call_logs_userId_createdAt_idx" ON "function_call_logs"("userId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "function_call_logs_functionName_createdAt_idx" ON "function_call_logs"("functionName", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "function_call_logs_conversationId_createdAt_idx" ON "function_call_logs"("conversationId", "createdAt" DESC);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'accounts_userId_fkey') THEN
    ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sessions_userId_fkey') THEN
    ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_profiles_userId_fkey') THEN
    ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'conversations_userId_fkey') THEN
    ALTER TABLE "conversations" ADD CONSTRAINT "conversations_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'messages_conversationId_fkey') THEN
    ALTER TABLE "messages" ADD CONSTRAINT "messages_conversationId_fkey"
      FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'function_call_logs_userId_fkey') THEN
    ALTER TABLE "function_call_logs" ADD CONSTRAINT "function_call_logs_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'function_call_logs_conversationId_fkey') THEN
    ALTER TABLE "function_call_logs" ADD CONSTRAINT "function_call_logs_conversationId_fkey"
      FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
