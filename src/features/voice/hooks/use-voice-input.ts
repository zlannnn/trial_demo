"use client";

import { useCallback, useState } from "react";

import { api } from "~/trpc/react";

import type { UseVoiceInputReturn, VoiceError, VoiceStatus } from "../types";
import { useAudioRecorder } from "./use-audio-recorder";

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      if (!base64) {
        reject(new Error("Failed to encode audio"));
        return;
      }
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("Failed to read audio blob"));
    reader.readAsDataURL(blob);
  });
}

export function useVoiceInput(options?: {
  language?: string;
  prompt?: string;
}): UseVoiceInputReturn {
  const recorder = useAudioRecorder();
  const transcribeMutation = api.voice.transcribe.useMutation();
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [transcript, setTranscript] = useState<string | null>(null);
  const [error, setError] = useState<VoiceError | null>(null);

  const reset = useCallback(() => {
    recorder.resetRecording();
    setStatus("idle");
    setTranscript(null);
    setError(null);
  }, [recorder]);

  const startRecording = useCallback(async () => {
    setError(null);
    setTranscript(null);
    setStatus("recording");
    await recorder.startRecording();
  }, [recorder]);

  const stopAndTranscribe = useCallback(async (): Promise<string | null> => {
    void options?.language;
    void options?.prompt;

    try {
      setStatus("uploading");
      const blob = await recorder.stopRecording();

      if (!blob || blob.size === 0) {
        throw new Error("录音为空，请重试");
      }

      setStatus("transcribing");
      const ext = blob.type.includes("mp4")
        ? "mp4"
        : blob.type.includes("ogg")
          ? "ogg"
          : "webm";

      const result = await transcribeMutation.mutateAsync({
        audioBase64: await blobToBase64(blob),
        mimeType: blob.type || "audio/webm",
        filename: `recording.${ext}`,
      });

      setTranscript(result.text);
      setStatus("idle");
      return result.text;
    } catch (err) {
      const voiceError: VoiceError =
        err instanceof Error
          ? { code: "TRANSCRIBE_ERROR", message: err.message }
          : { code: "TRANSCRIBE_ERROR", message: "语音转文字失败" };

      setError(voiceError);
      setStatus("error");
      return null;
    }
  }, [options?.language, options?.prompt, recorder, transcribeMutation]);

  return {
    status,
    transcript,
    error: error ?? recorder.error,
    isRecording: recorder.isRecording,
    durationMs: recorder.durationMs,
    startRecording,
    stopAndTranscribe,
    reset,
  };
}
