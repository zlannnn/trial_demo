import { env } from "~/env";

export const voiceConfig = {
  ttsModel: env.OPENAI_TTS_MODEL,
  ttsVoice: env.OPENAI_TTS_VOICE,
  whisperModel: env.OPENAI_WHISPER_MODEL,
  maxAudioSizeBytes: 25 * 1024 * 1024,
  preferredMimeTypes: [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
  ],
} as const;

export type TtsVoice = (typeof voiceConfig)["ttsVoice"];
