"use client";

import { Mic, Send, Square } from "lucide-react";
import { useCallback, useRef, useState } from "react";

import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { cn } from "~/lib/utils";
import { formatDuration } from "~/features/voice/utils/audio-utils";

interface ChatComposerProps {
  onSend: (text: string) => void;
  onStartRecording: () => void;
  onStopRecording: () => Promise<string | null>;
  disabled?: boolean;
  isLoading?: boolean;
  isRecording?: boolean;
  recordingDurationMs?: number;
  voiceSttAvailable?: boolean;
  voiceUnavailableHint?: string;
}

export function ChatComposer({
  onSend,
  onStartRecording,
  onStopRecording,
  disabled,
  isLoading,
  isRecording,
  recordingDurationMs = 0,
  voiceSttAvailable = false,
  voiceUnavailableHint,
}: ChatComposerProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const micDisabled = disabled || isLoading || !voiceSttAvailable;

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || disabled || isLoading) return;
    onSend(trimmed);
    setInput("");
    textareaRef.current?.focus();
  }, [disabled, input, isLoading, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleMicClick = async () => {
    if (!voiceSttAvailable) return;

    if (isRecording) {
      const text = await onStopRecording();
      if (text) {
        setInput(text);
        textareaRef.current?.focus();
      }
    } else {
      await onStartRecording();
    }
  };

  return (
    <div className="border-t bg-background p-4">
      <div className="mx-auto max-w-3xl">
        {isRecording && (
          <div className="mb-2 flex items-center justify-center gap-2 text-sm text-destructive">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-destructive" />
            </span>
            录音中 {formatDuration(recordingDurationMs)}
          </div>
        )}

        <div className="relative flex items-end gap-2 rounded-2xl border bg-muted/30 p-2 shadow-sm">
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant={isRecording ? "destructive" : "ghost"}
                  size="icon"
                  className={cn(
                    "h-10 w-10 shrink-0 rounded-xl",
                    isRecording && "animate-pulse",
                    !voiceSttAvailable && "opacity-50",
                  )}
                  onClick={() => void handleMicClick()}
                  disabled={micDisabled && !isRecording}
                  aria-label={isRecording ? "停止录音" : "语音输入"}
                >
                  {isRecording ? (
                    <Square className="h-4 w-4 fill-current" />
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {!voiceSttAvailable
                  ? (voiceUnavailableHint ?? "语音输入不可用")
                  : isRecording
                    ? "停止并转写"
                    : "语音输入"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入消息，或点击麦克风说话…"
            disabled={disabled || isLoading || isRecording}
            rows={1}
            className="max-h-40 min-h-[44px] flex-1 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0"
          />

          <Button
            type="button"
            size="icon"
            className="h-10 w-10 shrink-0 rounded-xl"
            onClick={handleSend}
            disabled={!input.trim() || disabled || isLoading || isRecording}
            aria-label="发送"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        <p className="mt-2 text-center text-xs text-muted-foreground">
          Enter 发送 · Shift+Enter 换行
        </p>
      </div>
    </div>
  );
}
