import { z } from "zod";

const envSchema = z.object({
  /** DeepSeek — 文本 Agent（Chat Completions + Tool Calling） */
  DEEPSEEK_API_KEY: z.string().min(1, "DEEPSEEK_API_KEY is required"),
  DEEPSEEK_BASE_URL: z.string().default("https://api.deepseek.com"),
  DEEPSEEK_MODEL: z.string().default("deepseek-v4-flash"),

  /** OpenAI — 仅用于语音 STT/TTS（Phase 3 前可选） */
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_BASE_URL: z.string().default("https://api.openai.com/v1"),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  /** 语音分阶段开关：Phase1 文本 → Phase2 工具 → Phase3 语音 */
  VOICE_STT_ENABLED: z
    .enum(["true", "false"])
    .default("true")
    .transform((v) => v === "true"),
  VOICE_TTS_ENABLED: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .default("true"),
});

function createEnv() {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const message = parsed.error.errors
      .map((e) => `${e.path.join(".")}: ${e.message}`)
      .join("\n");
    throw new Error(`Invalid environment variables:\n${message}`);
  }

  return parsed.data;
}

export const env = createEnv();

export const aiConfig = {
  /** DeepSeek v4 flash — Chat Completions */
  provider: "deepseek" as const,
  model: env.DEEPSEEK_MODEL,
  baseURL: env.DEEPSEEK_BASE_URL,
  /** Agent 工具调用最大循环次数 */
  maxToolIterations: 10,
  /** 从 DB 加载的历史消息条数上限 */
  maxHistoryMessages: 20,
  /** 工具调用后使用 JSON Structured Output 生成最终回复 */
  structuredOutput: true,
  /** 非 thinking 模式默认 temperature */
  temperature: 0.7,
} as const;

export const voicePhaseConfig = {
  sttEnabled: env.VOICE_STT_ENABLED,
  ttsEnabled: env.VOICE_TTS_ENABLED,
  /** Phase 3 实时语音 Agent — 尚未接入 */
  realtimeEnabled: false,
} as const;

export function isVoiceSttAvailable(): boolean {
  return voicePhaseConfig.sttEnabled && !!env.OPENAI_API_KEY;
}

export function isVoiceTtsAvailable(): boolean {
  return voicePhaseConfig.ttsEnabled && !!env.OPENAI_API_KEY;
}
