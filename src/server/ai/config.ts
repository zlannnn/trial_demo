import { env } from "~/env";

export const aiConfig = {
  provider: "deepseek" as const,
  model: env.DEEPSEEK_MODEL,
  baseURL: env.DEEPSEEK_BASE_URL,
  maxToolIterations: 10,
  maxHistoryMessages: 20,
  structuredOutput: true,
  temperature: 0.7,
};

export const voicePhaseConfig = {
  sttEnabled: env.VOICE_STT_ENABLED,
  ttsEnabled: env.VOICE_TTS_ENABLED,
  realtimeEnabled: false,
};

export function isVoiceSttAvailable(): boolean {
  return voicePhaseConfig.sttEnabled && !!env.OPENAI_API_KEY;
}

export function isVoiceTtsAvailable(): boolean {
  return voicePhaseConfig.ttsEnabled && !!env.OPENAI_API_KEY;
}
