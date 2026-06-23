import OpenAI from "openai";

import { env } from "./config";

const globalForLLM = globalThis as unknown as {
  deepseek: OpenAI | undefined;
  openaiVoice: OpenAI | undefined;
};

/**
 * DeepSeek 客户端 — Chat Completions + Tool Calling + JSON Output
 * @see https://api-docs.deepseek.com/
 */
export const deepseek =
  globalForLLM.deepseek ??
  new OpenAI({
    apiKey: env.DEEPSEEK_API_KEY,
    baseURL: env.DEEPSEEK_BASE_URL,
  });

/**
 * OpenAI 客户端 — 仅用于 Whisper STT / TTS（Phase 3 前可选）
 */
export const openaiVoice = env.OPENAI_API_KEY
  ? (globalForLLM.openaiVoice ??
    new OpenAI({
      apiKey: env.OPENAI_API_KEY,
      baseURL: env.OPENAI_BASE_URL,
    }))
  : null;

if (process.env.NODE_ENV !== "production") {
  globalForLLM.deepseek = deepseek;
  if (openaiVoice) globalForLLM.openaiVoice = openaiVoice;
}

/** @deprecated 使用 deepseek */
export const openai = deepseek;
