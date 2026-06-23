"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { UseAudioRecorderReturn, VoiceError } from "../types";
import { getSupportedMimeType } from "../utils/audio-utils";

export function useAudioRecorder(): UseAudioRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [durationMs, setDurationMs] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);
  const [error, setError] = useState<VoiceError | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);

  const isSupported =
    typeof window !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof MediaRecorder !== "undefined" &&
    getSupportedMimeType() !== null;

  const cleanupStream = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    mediaRecorderRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      cleanupStream();
    };
  }, [cleanupStream]);

  const resetRecording = useCallback(() => {
    cleanupStream();
    setIsRecording(false);
    setDurationMs(0);
    setAudioBlob(null);
    setMimeType(null);
    setError(null);
    chunksRef.current = [];
  }, [cleanupStream]);

  const startRecording = useCallback(async () => {
    if (!isSupported) {
      setError({
        code: "NOT_SUPPORTED",
        message: "当前浏览器不支持录音",
      });
      return;
    }

    try {
      resetRecording();

      const supportedMime = getSupportedMimeType();
      if (!supportedMime) {
        throw new Error("No supported audio MIME type");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;
      chunksRef.current = [];

      const recorder = new MediaRecorder(stream, { mimeType: supportedMime });
      mediaRecorderRef.current = recorder;
      setMimeType(supportedMime);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onerror = () => {
        setError({ code: "RECORDER_ERROR", message: "录音过程中发生错误" });
        setIsRecording(false);
        cleanupStream();
      };

      recorder.start(250);
      startTimeRef.current = Date.now();
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setDurationMs(Date.now() - startTimeRef.current);
      }, 200);
    } catch (err) {
      const message =
        err instanceof DOMException && err.name === "NotAllowedError"
          ? "麦克风权限被拒绝，请在浏览器设置中允许访问"
          : err instanceof Error
            ? err.message
            : "无法启动录音";
      setError({ code: "MIC_ACCESS_DENIED", message });
      cleanupStream();
    }
  }, [cleanupStream, isSupported, resetRecording]);

  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    const recorder = mediaRecorderRef.current;

    if (!recorder || recorder.state === "inactive") {
      cleanupStream();
      setIsRecording(false);
      return audioBlob;
    }

    return new Promise((resolve) => {
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: mimeType ?? "audio/webm",
        });
        setAudioBlob(blob);
        setIsRecording(false);
        setDurationMs(Date.now() - startTimeRef.current);
        cleanupStream();
        resolve(blob.size > 0 ? blob : null);
      };

      recorder.stop();
    });
  }, [audioBlob, cleanupStream, mimeType]);

  return {
    isRecording,
    isSupported,
    durationMs,
    audioBlob,
    mimeType,
    error,
    startRecording,
    stopRecording,
    resetRecording,
  };
}
