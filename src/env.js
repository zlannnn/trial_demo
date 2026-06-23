import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    /** NextAuth；未设置时开发/构建使用 fallback，生产部署请在 Vercel 配置 */
    AUTH_SECRET: z.string().min(1).optional(),
    AUTH_URL: z.string().url().optional(),
    AUTH_GOOGLE_ID: z.string().min(1).optional(),
    AUTH_GOOGLE_SECRET: z.string().min(1).optional(),
    DATABASE_URL: z.string().url(),
    DEEPSEEK_API_KEY: z.string().min(1),
    DEEPSEEK_BASE_URL: z.string().default("https://api.deepseek.com"),
    DEEPSEEK_MODEL: z.string().default("deepseek-v4-flash"),
    OPENAI_API_KEY: z.string().optional(),
    OPENAI_BASE_URL: z.string().default("https://api.openai.com/v1"),
    OPENAI_TTS_MODEL: z.string().default("tts-1"),
    OPENAI_TTS_VOICE: z
      .enum(["alloy", "echo", "fable", "onyx", "nova", "shimmer"])
      .default("alloy"),
    OPENAI_WHISPER_MODEL: z.string().default("whisper-1"),
    VOICE_STT_ENABLED: z
      .enum(["true", "false"])
      .default("true")
      .transform((v) => v === "true"),
    VOICE_TTS_ENABLED: z
      .enum(["true", "false"])
      .default("true")
      .transform((v) => v === "true"),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
  },
  client: {},
  runtimeEnv: {
    AUTH_SECRET: process.env.AUTH_SECRET,
    AUTH_URL: process.env.AUTH_URL,
    AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID,
    AUTH_GOOGLE_SECRET: process.env.AUTH_GOOGLE_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
    DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY,
    DEEPSEEK_BASE_URL: process.env.DEEPSEEK_BASE_URL,
    DEEPSEEK_MODEL: process.env.DEEPSEEK_MODEL,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_BASE_URL: process.env.OPENAI_BASE_URL,
    OPENAI_TTS_MODEL: process.env.OPENAI_TTS_MODEL,
    OPENAI_TTS_VOICE: process.env.OPENAI_TTS_VOICE,
    OPENAI_WHISPER_MODEL: process.env.OPENAI_WHISPER_MODEL,
    VOICE_STT_ENABLED: process.env.VOICE_STT_ENABLED,
    VOICE_TTS_ENABLED: process.env.VOICE_TTS_ENABLED,
    NODE_ENV: process.env.NODE_ENV,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});

export function getAuthSecret() {
  return env.AUTH_SECRET ?? "dev-only-auth-secret-do-not-use-in-production";
}

export function isGoogleAuthConfigured() {
  return !!(env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET);
}
