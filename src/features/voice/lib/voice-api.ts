import type { TranscribeResponse, TtsRequest } from "../types";

export class VoiceApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "VoiceApiError";
  }
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      if (!base64) {
        reject(new VoiceApiError("Failed to encode audio"));
        return;
      }
      resolve(base64);
    };
    reader.onerror = () => reject(new VoiceApiError("Failed to read audio blob"));
    reader.readAsDataURL(blob);
  });
}

type TranscribeFn = (input: {
  audioBase64: string;
  mimeType?: string;
  filename?: string;
}) => Promise<TranscribeResponse>;

type SynthesizeFn = (input: TtsRequest) => Promise<{
  audioBase64: string;
  contentType: string;
}>;

let transcribeFn: TranscribeFn | null = null;
let synthesizeFn: SynthesizeFn | null = null;

export function registerVoiceTrpcClient(handlers: {
  transcribe: TranscribeFn;
  synthesize: SynthesizeFn;
}) {
  transcribeFn = handlers.transcribe;
  synthesizeFn = handlers.synthesize;
}

export async function transcribeAudioBlob(
  blob: Blob,
  options?: { language?: string; prompt?: string },
): Promise<TranscribeResponse> {
  void options;
  if (!transcribeFn) {
    throw new VoiceApiError("Voice client not initialized");
  }

  const ext = blob.type.includes("mp4")
    ? "mp4"
    : blob.type.includes("ogg")
      ? "ogg"
      : "webm";

  return transcribeFn({
    audioBase64: await blobToBase64(blob),
    mimeType: blob.type || "audio/webm",
    filename: `recording.${ext}`,
  });
}

export async function fetchTtsStream(
  request: TtsRequest,
): Promise<ReadableStream<Uint8Array>> {
  if (!synthesizeFn) {
    throw new VoiceApiError("Voice client not initialized");
  }

  const result = await synthesizeFn(request);
  const bytes = Uint8Array.from(atob(result.audioBase64), (c) =>
    c.charCodeAt(0),
  );

  return new ReadableStream({
    start(controller) {
      controller.enqueue(bytes);
      controller.close();
    },
  });
}

export async function synthesizeToBlob(
  request: TtsRequest,
  onProgress?: (progress: { bytesReceived: number }) => void,
): Promise<Blob> {
  const stream = await fetchTtsStream(request);
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let bytesReceived = 0;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      bytesReceived += value.length;
      onProgress?.({ bytesReceived });
    }
  }

  const total = chunks.reduce((sum, c) => sum + c.length, 0);
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }

  return new Blob([merged], { type: "audio/mpeg" });
}

export async function synthesizeAndPlay(
  request: TtsRequest,
  audio: HTMLAudioElement,
  onProgress?: (progress: { bytesReceived: number }) => void,
): Promise<void> {
  const blob = await synthesizeToBlob(request, onProgress);
  const url = URL.createObjectURL(blob);
  audio.src = url;
  await audio.play();
}
