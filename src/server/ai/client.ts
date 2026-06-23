import OpenAI from "openai";

import { getEnv } from "./config";

const globalForLLM = globalThis as unknown as {
  deepseek: OpenAI | undefined;
  openaiVoice: OpenAI | undefined;
};

/**
 * DeepSeek 客户端 — Chat Completions + Tool Calling + JSON Output
 * @see https://api-docs.deepseek.com/
 */
export function getDeepseek(): OpenAI {
  if (globalForLLM.deepseek) return globalForLLM.deepseek;

  const env = getEnv();
  const client = new OpenAI({
    apiKey: env.DEEPSEEK_API_KEY,
    baseURL: env.DEEPSEEK_BASE_URL,
  });

  if (process.env.NODE_ENV !== "production") {
    globalForLLM.deepseek = client;
  }

  return client;
}

/**
 * OpenAI 客户端 — 仅用于 Whisper STT / TTS（Phase 3 前可选）
 */
export function getOpenaiVoice(): OpenAI | null {
  const env = getEnv();
  if (!env.OPENAI_API_KEY) return null;

  if (globalForLLM.openaiVoice) return globalForLLM.openaiVoice;

  const client = new OpenAI({
    apiKey: env.OPENAI_API_KEY,
    baseURL: env.OPENAI_BASE_URL,
  });

  if (process.env.NODE_ENV !== "production") {
    globalForLLM.openaiVoice = client;
  }

  return client;
}

/** @deprecated 使用 getDeepseek() */
export const deepseek = {
  get chat() {
    return getDeepseek().chat;
  },
};

/** @deprecated 使用 getDeepseek() */
export const openai = deepseek;
