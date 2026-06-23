"use client";

import { useCallback, useState } from "react";

import type {
  UseVoiceChatOptions,
  UseVoiceChatReturn,
  VoiceError,
  VoiceStatus,
} from "../types";
import { useVoiceInput } from "./use-voice-input";
import { useVoiceOutput } from "./use-voice-output";

/**
 * 完整语音对话 Hook
 *
 * 流程：录音 → Whisper STT → (可选 AI) → OpenAI TTS 流式播放
 */
export function useVoiceChat(
  options: UseVoiceChatOptions = {},
): UseVoiceChatReturn {
  const { autoSpeak = true, language, onSendMessage, onTranscript, onReply } =
    options;

  const voiceInput = useVoiceInput({ language });
  const voiceOutput = useVoiceOutput();

  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [reply, setReply] = useState<string | null>(null);
  const [error, setError] = useState<VoiceError | null>(null);

  const reset = useCallback(() => {
    voiceInput.reset();
    voiceOutput.stop();
    setStatus("idle");
    setReply(null);
    setError(null);
  }, [voiceInput, voiceOutput]);

  const startRecording = useCallback(async () => {
    setReply(null);
    setError(null);
    setStatus("recording");
    await voiceInput.startRecording();
  }, [voiceInput]);

  const stopAndProcess = useCallback(async () => {
    try {
      setStatus("uploading");
      const text = await voiceInput.stopAndTranscribe();

      if (!text) {
        setStatus(voiceInput.error ? "error" : "idle");
        setError(voiceInput.error);
        return;
      }

      onTranscript?.(text);
      setStatus("idle");

      if (!onSendMessage) return;

      const aiReply = await onSendMessage(text);
      setReply(aiReply);
      onReply?.(aiReply);

      if (autoSpeak && aiReply) {
        setStatus("speaking");
        await voiceOutput.speak(aiReply);
      }

      setStatus("idle");
    } catch (err) {
      const voiceError: VoiceError =
        err instanceof Error
          ? { code: "CHAT_ERROR", message: err.message }
          : { code: "CHAT_ERROR", message: "语音对话处理失败" };

      setError(voiceError);
      setStatus("error");
    }
  }, [autoSpeak, onReply, onSendMessage, onTranscript, voiceInput, voiceOutput]);

  return {
    status: status !== "idle" ? status : voiceInput.status,
    transcript: voiceInput.transcript,
    reply,
    error: error ?? voiceInput.error ?? voiceOutput.error,
    isRecording: voiceInput.isRecording,
    isSpeaking: voiceOutput.isSpeaking,
    startRecording,
    stopAndProcess,
    reset,
  };
}
