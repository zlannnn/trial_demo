import { NextResponse } from "next/server";

import {
  aiConfig,
  isVoiceSttAvailable,
  isVoiceTtsAvailable,
  voicePhaseConfig,
} from "~/server/ai/config";

export const runtime = "nodejs";

/** 前端读取当前 AI / 语音配置 */
export async function GET() {
  const sttAvailable = isVoiceSttAvailable();
  const ttsAvailable = isVoiceTtsAvailable();

  return NextResponse.json({
    provider: aiConfig.provider,
    model: aiConfig.model,
    voice: {
      sttEnabled: voicePhaseConfig.sttEnabled,
      ttsEnabled: voicePhaseConfig.ttsEnabled,
      sttAvailable,
      ttsAvailable,
      realtimeEnabled: voicePhaseConfig.realtimeEnabled,
      unavailableHint: !sttAvailable || !ttsAvailable
        ? "语音功能需要配置 OPENAI_API_KEY（用于 Whisper STT / TTS）"
        : undefined,
    },
  });
}
