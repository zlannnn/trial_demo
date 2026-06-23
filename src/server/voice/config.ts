import { z } from "zod";

const voiceEnvSchema = z.object({
  OPENAI_TTS_MODEL: z.string().default("tts-1"),
  OPENAI_TTS_VOICE: z
    .enum(["alloy", "echo", "fable", "onyx", "nova", "shimmer"])
    .default("alloy"),
  OPENAI_WHISPER_MODEL: z.string().default("whisper-1"),
});

const parsed = voiceEnvSchema.safeParse(process.env);

if (!parsed.success) {
  throw new Error("Invalid voice environment configuration");
}

export const voiceConfig = {
  ttsModel: parsed.data.OPENAI_TTS_MODEL,
  ttsVoice: parsed.data.OPENAI_TTS_VOICE,
  whisperModel: parsed.data.OPENAI_WHISPER_MODEL,
  /** 录音上传最大体积 25MB（Whisper 限制） */
  maxAudioSizeBytes: 25 * 1024 * 1024,
  /** MediaRecorder 首选 MIME */
  preferredMimeTypes: [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
  ],
} as const;

export type TtsVoice = (typeof voiceConfig)["ttsVoice"];
