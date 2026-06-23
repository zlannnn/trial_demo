"use client";

import { useCallback, useState } from "react";

import { useVoiceChat } from "../hooks/use-voice-chat";
import { synthesizeToBlob } from "../lib/voice-api";
import { AudioPlayer } from "./audio-player";
import { MicButton } from "./mic-button";

export interface VoiceChatProps {
  /** 外部 AI 处理 — 接收用户文本，返回 AI 回复 */
  onSendMessage: (text: string) => Promise<string>;
  language?: string;
  autoSpeak?: boolean;
  className?: string;
}

const STATUS_LABEL: Record<string, string> = {
  idle: "按住麦克风说话",
  recording: "正在聆听…",
  uploading: "上传录音…",
  transcribing: "识别语音…",
  speaking: "播放回复中…",
  error: "发生错误",
};

export function VoiceChat({
  onSendMessage,
  language,
  autoSpeak = true,
  className,
}: VoiceChatProps) {
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  const {
    status,
    transcript,
    reply,
    error,
    isRecording,
    isSpeaking,
    startRecording,
    stopAndProcess,
    reset,
  } = useVoiceChat({
    language,
    autoSpeak,
    onSendMessage,
    onReply: async (text) => {
      if (!autoSpeak) {
        const blob = await synthesizeToBlob({ text });
        setAudioBlob(blob);
      }
    },
  });

  const handleStop = useCallback(async () => {
    await stopAndProcess();
  }, [stopAndProcess]);

  const handleReset = useCallback(() => {
    reset();
    setAudioBlob(null);
  }, [reset]);

  return (
    <div
      className={className}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 20,
        maxWidth: 480,
        margin: "0 auto",
        padding: 24,
      }}
    >
      <MicButton
        isRecording={isRecording}
        disabled={
          status === "uploading" ||
          status === "transcribing" ||
          isSpeaking
        }
        onStart={() => void startRecording()}
        onStop={() => void handleStop()}
      />

      <p style={{ textAlign: "center", color: "#6b7280", fontSize: 14, margin: 0 }}>
        {error?.message ?? STATUS_LABEL[status] ?? status}
      </p>

      {transcript && (
        <MessageBubble label="你说" text={transcript} variant="user" />
      )}

      {reply && (
        <MessageBubble label="AI" text={reply} variant="assistant" />
      )}

      {!autoSpeak && audioBlob && (
        <AudioPlayer src={audioBlob} autoPlay />
      )}

      {(transcript || reply) && (
        <button
          type="button"
          onClick={handleReset}
          style={{
            alignSelf: "center",
            padding: "8px 16px",
            fontSize: 13,
            color: "#6b7280",
            background: "#f9fafb",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          新对话
        </button>
      )}
    </div>
  );
}

function MessageBubble({
  label,
  text,
  variant,
}: {
  label: string;
  text: string;
  variant: "user" | "assistant";
}) {
  const isUser = variant === "user";

  return (
    <div
      style={{
        padding: 16,
        borderRadius: 12,
        background: isUser ? "#eff6ff" : "#f0fdf4",
        border: `1px solid ${isUser ? "#bfdbfe" : "#bbf7d0"}`,
      }}
    >
      <p
        style={{
          margin: "0 0 6px",
          fontSize: 12,
          color: isUser ? "#3b82f6" : "#16a34a",
          fontWeight: 500,
        }}
      >
        {label}
      </p>
      <p style={{ margin: 0, fontSize: 15, color: "#111827", lineHeight: 1.5 }}>
        {text}
      </p>
    </div>
  );
}
