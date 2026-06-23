"use client";

import { useVoiceInput } from "../hooks/use-voice-input";
import { MicButton } from "./mic-button";

export interface VoiceInputProps {
  language?: string;
  prompt?: string;
  onTranscript?: (text: string) => void;
  className?: string;
}

const STATUS_LABEL: Record<string, string> = {
  idle: "点击麦克风开始说话",
  recording: "正在录音…",
  uploading: "上传中…",
  transcribing: "识别中…",
  error: "出错了",
};

export function VoiceInput({
  language,
  prompt,
  onTranscript,
  className,
}: VoiceInputProps) {
  const {
    status,
    transcript,
    error,
    isRecording,
    durationMs,
    startRecording,
    stopAndTranscribe,
    reset,
  } = useVoiceInput({ language, prompt });

  const handleStop = async () => {
    const text = await stopAndTranscribe();
    if (text) onTranscript?.(text);
  };

  return (
    <div className={className} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <MicButton
        isRecording={isRecording}
        durationMs={durationMs}
        disabled={status === "uploading" || status === "transcribing"}
        onStart={() => void startRecording()}
        onStop={() => void handleStop()}
      />

      <p style={{ textAlign: "center", color: "#6b7280", fontSize: 14, margin: 0 }}>
        {error?.message ?? STATUS_LABEL[status] ?? status}
      </p>

      {transcript && (
        <div
          style={{
            padding: 16,
            borderRadius: 12,
            background: "#f3f4f6",
            border: "1px solid #e5e7eb",
          }}
        >
          <p style={{ margin: "0 0 8px", fontSize: 12, color: "#9ca3af" }}>识别结果</p>
          <p style={{ margin: 0, fontSize: 16, color: "#111827" }}>{transcript}</p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 12,
              fontSize: 13,
              color: "#6b7280",
              background: "none",
              border: "none",
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            清除
          </button>
        </div>
      )}
    </div>
  );
}
