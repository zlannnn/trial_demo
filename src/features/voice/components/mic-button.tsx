"use client";

import { formatDuration } from "../utils/audio-utils";

export interface MicButtonProps {
  isRecording: boolean;
  durationMs?: number;
  disabled?: boolean;
  onStart: () => void;
  onStop: () => void;
  className?: string;
}

export function MicButton({
  isRecording,
  durationMs = 0,
  disabled = false,
  onStart,
  onStop,
  className,
}: MicButtonProps) {
  const handleClick = () => {
    if (isRecording) {
      onStop();
    } else {
      onStart();
    }
  };

  return (
    <div
      className={className}
      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}
    >
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        aria-label={isRecording ? "停止录音" : "开始录音"}
        aria-pressed={isRecording}
        style={{
          width: 72,
          height: 72,
          borderRadius: "50%",
          border: "none",
          background: isRecording ? "#ef4444" : "#3b82f6",
          color: "#fff",
          fontSize: 28,
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.5 : 1,
          boxShadow: isRecording
            ? "0 0 0 8px rgba(239,68,68,0.2)"
            : "0 4px 14px rgba(59,130,246,0.4)",
          transition: "all 0.2s ease",
        }}
      >
        {isRecording ? "⏹" : "🎤"}
      </button>

      {isRecording && (
        <span style={{ fontSize: 14, color: "#ef4444", fontWeight: 500 }}>
          {formatDuration(durationMs)}
        </span>
      )}
    </div>
  );
}
