import { isVoiceTtsAvailable } from "~/server/ai/config";
import { getOpenaiVoice } from "~/server/ai/client";

import { voiceConfig, type TtsVoice } from "./config";

export interface TtsOptions {
  voice?: TtsVoice;
  model?: string;
  speed?: number;
}

export async function synthesizeSpeechStream(
  text: string,
  options: TtsOptions = {},
): Promise<ReadableStream<Uint8Array>> {
  const openaiVoice = getOpenaiVoice();
  if (!isVoiceTtsAvailable() || !openaiVoice) {
    throw new Error(
      "Voice TTS is disabled. Set VOICE_TTS_ENABLED=true and OPENAI_API_KEY.",
    );
  }

  if (!text.trim()) {
    throw new Error("TTS text cannot be empty");
  }

  const response = await openaiVoice.audio.speech.create({
    model: options.model ?? voiceConfig.ttsModel,
    voice: options.voice ?? voiceConfig.ttsVoice,
    input: text,
    response_format: "mp3",
    speed: options.speed,
  });

  const body = response.body;
  if (!body) {
    throw new Error("TTS response has no body stream");
  }

  return body as unknown as ReadableStream<Uint8Array>;
}

export async function synthesizeSpeechBuffer(
  text: string,
  options: TtsOptions = {},
): Promise<Buffer> {
  const stream = await synthesizeSpeechStream(text, options);
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }

  return Buffer.concat(chunks);
}
