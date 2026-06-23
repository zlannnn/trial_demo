import { VOICE_API } from "../constants";
import type { StreamProgress, TranscribeResponse, TtsRequest } from "../types";
import { playStreamingMp3, readStreamToBlob } from "../utils/audio-utils";

export class VoiceApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "VoiceApiError";
  }
}

/** 上传录音并调用 Whisper STT */
export async function transcribeAudioBlob(
  blob: Blob,
  options?: { language?: string; prompt?: string },
): Promise<TranscribeResponse> {
  const formData = new FormData();
  const ext = blob.type.includes("mp4")
    ? "mp4"
    : blob.type.includes("ogg")
      ? "ogg"
      : "webm";
  formData.append("audio", blob, `recording.${ext}`);

  const params = new URLSearchParams();
  if (options?.language) params.set("language", options.language);
  if (options?.prompt) params.set("prompt", options.prompt);

  const url = params.toString()
    ? `${VOICE_API.transcribe}?${params}`
    : VOICE_API.transcribe;

  const response = await fetch(url, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as {
      error?: string;
    };
    throw new VoiceApiError(
      body.error ?? `Transcription failed (${response.status})`,
      response.status,
    );
  }

  return response.json() as Promise<TranscribeResponse>;
}

/** 请求 TTS 流式 mp3 */
export async function fetchTtsStream(
  request: TtsRequest,
): Promise<ReadableStream<Uint8Array>> {
  const response = await fetch(VOICE_API.tts, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as {
      error?: string;
    };
    throw new VoiceApiError(
      body.error ?? `TTS failed (${response.status})`,
      response.status,
    );
  }

  const body = response.body;
  if (!body) {
    throw new VoiceApiError("TTS response has no stream body");
  }

  return body;
}

/** 流式 TTS → 完整 Blob */
export async function synthesizeToBlob(
  request: TtsRequest,
  onProgress?: (progress: StreamProgress) => void,
): Promise<Blob> {
  const stream = await fetchTtsStream(request);
  const blob = await readStreamToBlob(stream, (bytesReceived) => {
    onProgress?.({ bytesReceived });
  });
  return blob;
}

/** 流式 TTS → 边下边播 */
export async function synthesizeAndPlay(
  request: TtsRequest,
  audio: HTMLAudioElement,
  onProgress?: (progress: StreamProgress) => void,
): Promise<void> {
  const stream = await fetchTtsStream(request);
  await playStreamingMp3(stream, audio, (bytesReceived) => {
    onProgress?.({ bytesReceived });
  });
}
