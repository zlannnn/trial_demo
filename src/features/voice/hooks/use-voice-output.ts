"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { api } from "~/trpc/react";

import type {
  StreamProgress,
  TtsRequest,
  UseVoiceOutputReturn,
  VoiceError,
  VoiceStatus,
} from "../types";
import { revokeObjectUrl } from "../utils/audio-utils";

export function useVoiceOutput(): UseVoiceOutputReturn {
  const synthesizeMutation = api.voice.synthesize.useMutation();
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [progress, setProgress] = useState<StreamProgress | null>(null);
  const [error, setError] = useState<VoiceError | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    audioRef.current = new Audio();
    const audio = audioRef.current;

    const onEnded = () => setStatus("idle");
    const onError = () => {
      setError({ code: "PLAYBACK_ERROR", message: "音频播放失败" });
      setStatus("error");
    };

    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);

    return () => {
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
      audio.pause();
      revokeObjectUrl(objectUrlRef.current);
    };
  }, []);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    revokeObjectUrl(objectUrlRef.current);
    objectUrlRef.current = null;
    setProgress(null);
    setStatus("idle");
  }, []);

  const speak = useCallback(
    async (text: string, options?: TtsRequest) => {
      if (!text.trim()) return;

      stop();
      setError(null);
      setStatus("speaking");
      setProgress({ bytesReceived: 0 });

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const audio = audioRef.current;
        if (!audio) throw new Error("Audio element not initialized");

        const result = await synthesizeMutation.mutateAsync({
          text,
          voice: options?.voice as
            | "alloy"
            | "echo"
            | "fable"
            | "onyx"
            | "nova"
            | "shimmer"
            | undefined,
          speed: options?.speed,
        });

        if (controller.signal.aborted) return;

        const bytes = Uint8Array.from(atob(result.audioBase64), (c) =>
          c.charCodeAt(0),
        );
        setProgress({ bytesReceived: bytes.length });

        revokeObjectUrl(objectUrlRef.current);
        const blob = new Blob([bytes], { type: result.contentType });
        const url = URL.createObjectURL(blob);
        objectUrlRef.current = url;
        audio.src = url;
        await audio.play();

        if (!controller.signal.aborted) {
          setStatus("speaking");
        }
      } catch (err) {
        if (controller.signal.aborted) return;

        const voiceError: VoiceError =
          err instanceof Error
            ? { code: "TTS_ERROR", message: err.message }
            : { code: "TTS_ERROR", message: "语音合成失败" };

        setError(voiceError);
        setStatus("error");
      }
    },
    [stop, synthesizeMutation],
  );

  return {
    status,
    isSpeaking: status === "speaking",
    progress,
    error,
    speak,
    stop,
  };
}
