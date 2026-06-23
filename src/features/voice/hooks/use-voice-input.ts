"use client";

import { useCallback, useState } from "react";

import { VoiceApiError, transcribeAudioBlob } from "../lib/voice-api";
import type { UseVoiceInputReturn, VoiceError, VoiceStatus } from "../types";
import { useAudioRecorder } from "./use-audio-recorder";

export function useVoiceInput(options?: {
  language?: string;
  prompt?: string;
}): UseVoiceInputReturn {
  const recorder = useAudioRecorder();
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
    try {
      setStatus("uploading");
      const blob = await recorder.stopRecording();

      if (!blob || blob.size === 0) {
        throw new VoiceApiError("录音为空，请重试");
      }

      setStatus("transcribing");
      const result = await transcribeAudioBlob(blob, {
        language: options?.language,
        prompt: options?.prompt,
      });

      setTranscript(result.text);
      setStatus("idle");
      return result.text;
    } catch (err) {
      const voiceError: VoiceError =
        err instanceof VoiceApiError
          ? { code: "TRANSCRIBE_ERROR", message: err.message }
          : err instanceof Error
            ? { code: "TRANSCRIBE_ERROR", message: err.message }
            : { code: "TRANSCRIBE_ERROR", message: "语音转文字失败" };

      setError(voiceError);
      setStatus("error");
      return null;
    }
  }, [options?.language, options?.prompt, recorder]);

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
