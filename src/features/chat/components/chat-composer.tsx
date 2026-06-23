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

import { QuickPromptBar } from "./welcome-panel";

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
  showQuickPrompts?: boolean;
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
  showQuickPrompts,
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

  const handleQuickPrompt = (text: string) => {
    onSend(text);
  };

  return (
    <div className="border-t border-border/60 bg-card/20 p-4 backdrop-blur-md">
      <div className="mx-auto max-w-3xl space-y-3">
        {showQuickPrompts && (
          <QuickPromptBar onSelect={handleQuickPrompt} />
        )}

        {isRecording && (
          <div className="flex items-center justify-center gap-2 rounded-xl bg-red-500/10 py-2 text-sm text-red-400">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-400" />
            </span>
            客户发言录音中 {formatDuration(recordingDurationMs)}
          </div>
        )}

        <div className="relative flex items-end gap-2 rounded-2xl ghost-border bg-secondary/30 p-2 shadow-lg shadow-black/20">
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant={isRecording ? "destructive" : "ghost"}
                  size="icon"
                  className={cn(
                    "h-11 w-11 shrink-0 rounded-xl",
                    isRecording && "animate-pulse shadow-lg shadow-red-500/20",
                    !isRecording &&
                      voiceSttAvailable &&
                      "text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300",
                    !voiceSttAvailable && "opacity-50",
                  )}
                  onClick={() => void handleMicClick()}
                  disabled={micDisabled && !isRecording}
                  aria-label={isRecording ? "停止录音" : "语音输入"}
                >
                  {isRecording ? (
                    <Square className="h-4 w-4 fill-current" />
                  ) : (
                    <Mic className="h-5 w-5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {!voiceSttAvailable
                  ? (voiceUnavailableHint ?? "语音输入不可用")
                  : isRecording
                    ? "停止并转写客户发言"
                    : "模拟客户语音输入"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="模拟客户回复，或点击麦克风说话…"
            disabled={disabled || isLoading || isRecording}
            rows={1}
            className="max-h-40 min-h-[44px] flex-1 resize-none border-0 bg-transparent text-sm shadow-none placeholder:text-muted-foreground/50 focus-visible:ring-0"
          />

          <Button
            type="button"
            size="icon"
            className="h-11 w-11 shrink-0 rounded-xl bg-cyan-600 text-primary-foreground hover:bg-cyan-500 shadow-md shadow-cyan-500/20"
            onClick={handleSend}
            disabled={!input.trim() || disabled || isLoading || isRecording}
            aria-label="发送"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        <p className="text-center text-[11px] text-muted-foreground/60">
          Enter 发送 · Shift+Enter 换行 · J-Ghost 自然语音代理演示
        </p>
      </div>
    </div>
  );
}
