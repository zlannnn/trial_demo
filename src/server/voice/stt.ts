import { isVoiceSttAvailable } from "~/server/ai/config";
import { getOpenaiVoice } from "~/server/ai/client";

import { voiceConfig } from "./config";

export interface TranscribeOptions {
  language?: string;
  prompt?: string;
}

export interface TranscribeResult {
  text: string;
  language?: string;
  duration?: number;
}

export async function transcribeAudio(
  file: File | Blob,
  filename: string,
  options: TranscribeOptions = {},
): Promise<TranscribeResult> {
  const openaiVoice = getOpenaiVoice();
  if (!isVoiceSttAvailable() || !openaiVoice) {
    throw new Error(
      "Voice STT is disabled. Set VOICE_STT_ENABLED=true and OPENAI_API_KEY.",
    );
  }

  const transcription = await openaiVoice.audio.transcriptions.create({
    file: await toUploadableFile(file, filename),
    model: voiceConfig.whisperModel,
    language: options.language,
    prompt: options.prompt,
    response_format: "verbose_json",
  });

  return {
    text: transcription.text.trim(),
    language: transcription.language,
    duration: transcription.duration,
  };
}

async function toUploadableFile(file: File | Blob, filename: string) {
  if (file instanceof File) return file;
  return new File([file], filename, { type: file.type || "audio/webm" });
}
