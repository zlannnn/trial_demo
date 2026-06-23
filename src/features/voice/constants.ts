export const VOICE_API = {
  transcribe: "/api/voice/transcribe",
  tts: "/api/voice/tts",
} as const;

export const PREFERRED_MIME_TYPES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/ogg;codecs=opus",
] as const;

export const DEFAULT_TTS_VOICE = "alloy" as const;

/** 流式读取时的 chunk 回调间隔（字节） */
export const STREAM_PROGRESS_INTERVAL = 8192;
