import { PREFERRED_MIME_TYPES } from "../constants";

/** 检测浏览器支持的 MediaRecorder MIME 类型 */
export function getSupportedMimeType(): string | null {
  if (typeof MediaRecorder === "undefined") return null;

  for (const mimeType of PREFERRED_MIME_TYPES) {
    if (MediaRecorder.isTypeSupported(mimeType)) {
      return mimeType;
    }
  }

  return null;
}

/** 将多个 Uint8Array chunk 合并为 Blob */
export function chunksToBlob(
  chunks: Uint8Array[],
  mimeType = "audio/mpeg",
): Blob {
  return new Blob(chunks as BlobPart[], { type: mimeType });
}

/** 格式化录音时长 mm:ss */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

/** 安全释放 Object URL */
export function revokeObjectUrl(url: string | null | undefined): void {
  if (url) {
    URL.revokeObjectURL(url);
  }
}

/** 读取流并累积为 Blob，支持进度回调 */
export async function readStreamToBlob(
  stream: ReadableStream<Uint8Array>,
  onProgress?: (bytesReceived: number) => void,
): Promise<Blob> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let bytesReceived = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      bytesReceived += value.length;
      onProgress?.(bytesReceived);
    }
  }

  return chunksToBlob(chunks);
}

/**
 * 流式播放 mp3 — 边下载边播放
 * 使用 MediaSource API 追加 buffer
 */
export async function playStreamingMp3(
  stream: ReadableStream<Uint8Array>,
  audio: HTMLAudioElement,
  onProgress?: (bytesReceived: number) => void,
): Promise<void> {
  if (typeof MediaSource === "undefined") {
    const blob = await readStreamToBlob(stream, onProgress);
    audio.src = URL.createObjectURL(blob);
    await audio.play();
    return;
  }

  const mediaSource = new MediaSource();
  const objectUrl = URL.createObjectURL(mediaSource);
  audio.src = objectUrl;

  await new Promise<void>((resolve, reject) => {
    mediaSource.addEventListener(
      "sourceopen",
      () => {
        void appendStreamToMediaSource(
          mediaSource,
          stream,
          audio,
          onProgress,
        )
          .then(resolve)
          .catch(reject);
      },
      { once: true },
    );
    mediaSource.addEventListener(
      "error",
      () => reject(new Error("MediaSource error")),
      { once: true },
    );
  });
}

async function appendStreamToMediaSource(
  mediaSource: MediaSource,
  stream: ReadableStream<Uint8Array>,
  audio: HTMLAudioElement,
  onProgress?: (bytesReceived: number) => void,
): Promise<void> {
  const sourceBuffer = mediaSource.addSourceBuffer("audio/mpeg");
  const reader = stream.getReader();
  let bytesReceived = 0;
  let started = false;

  const append = (chunk: Uint8Array): Promise<void> =>
    new Promise((resolve, reject) => {
      const onUpdate = () => {
        sourceBuffer.removeEventListener("updateend", onUpdate);
        resolve();
      };
      sourceBuffer.addEventListener("updateend", onUpdate);
      sourceBuffer.addEventListener(
        "error",
        () => reject(new Error("SourceBuffer append failed")),
        { once: true },
      );
      sourceBuffer.appendBuffer(new Uint8Array(chunk) as BufferSource);
    });

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    if (value) {
      if (sourceBuffer.updating) {
        await new Promise<void>((resolve) => {
          sourceBuffer.addEventListener("updateend", () => resolve(), {
            once: true,
          });
        });
      }

      await append(value);
      bytesReceived += value.length;
      onProgress?.(bytesReceived);

      if (!started && bytesReceived > 4096) {
        started = true;
        await audio.play();
      }
    }
  }

  if (mediaSource.readyState === "open") {
    mediaSource.endOfStream();
  }

  if (!started) {
    await audio.play();
  }
}
