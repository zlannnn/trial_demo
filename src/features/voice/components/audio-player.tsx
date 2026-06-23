"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
} from "react";

import { revokeObjectUrl } from "../utils/audio-utils";

export interface AudioPlayerProps {
  src?: string | Blob | null;
  autoPlay?: boolean;
  className?: string;
  onEnded?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  onError?: (message: string) => void;
}

export function AudioPlayer({
  src,
  autoPlay = false,
  className,
  onEnded,
  onPlay,
  onPause,
  onError,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const objectUrlRef = useRef<string | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    revokeObjectUrl(objectUrlRef.current);
    objectUrlRef.current = null;

    if (!src) {
      audio.removeAttribute("src");
      audio.load();
      return;
    }

    setIsLoading(true);

    if (typeof src === "string") {
      audio.src = src;
    } else {
      const url = URL.createObjectURL(src);
      objectUrlRef.current = url;
      audio.src = url;
    }

    audio.load();

    if (autoPlay) {
      void audio.play().catch(() => {
        onError?.("自动播放被浏览器阻止，请手动点击播放");
      });
    }

    return () => {
      revokeObjectUrl(objectUrlRef.current);
      objectUrlRef.current = null;
    };
  }, [autoPlay, onError, src]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoaded = () => {
      setDuration(audio.duration || 0);
      setIsLoading(false);
    };
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handlePlay = () => {
      setIsPlaying(true);
      onPlay?.();
    };
    const handlePause = () => {
      setIsPlaying(false);
      onPause?.();
    };
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      onEnded?.();
    };
    const handleError = () => {
      setIsLoading(false);
      onError?.("音频加载失败");
    };

    audio.addEventListener("loadedmetadata", handleLoaded);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoaded);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
    };
  }, [onEnded, onError, onPause, onPlay]);

  const togglePlay = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || !src) return;

    if (isPlaying) {
      audio.pause();
    } else {
      await audio.play();
    }
  }, [isPlaying, src]);

  const handleSeek = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const audio = audioRef.current;
      if (!audio) return;
      const time = Number(e.target.value);
      audio.currentTime = time;
      setCurrentTime(time);
    },
    [],
  );

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={className} data-testid="audio-player">
      <audio ref={audioRef} preload="auto" />

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button
          type="button"
          onClick={() => void togglePlay()}
          disabled={!src || isLoading}
          aria-label={isPlaying ? "暂停" : "播放"}
          style={buttonStyle}
        >
          {isLoading ? "…" : isPlaying ? "⏸" : "▶"}
        </button>

        <div style={{ flex: 1 }}>
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            disabled={!src || !duration}
            style={{ width: "100%" }}
            aria-label="播放进度"
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 12,
              color: "#666",
              marginTop: 4,
            }}
          >
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            background: `conic-gradient(#3b82f6 ${progress}%, #e5e7eb 0)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 10,
            color: "#374151",
          }}
          aria-hidden
        >
          {Math.round(progress)}%
        </div>
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

const buttonStyle: CSSProperties = {
  width: 44,
  height: 44,
  borderRadius: "50%",
  border: "none",
  background: "#3b82f6",
  color: "#fff",
  fontSize: 18,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
