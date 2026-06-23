"use client";

import { useEffect, useRef } from "react";

import { ScrollArea } from "~/components/ui/scroll-area";

import type { ChatMessage } from "../types";
import { LoadingMessage } from "./loading-message";
import { MessageBubble } from "./message-bubble";

interface MessageListProps {
  messages: ChatMessage[];
  isLoading?: boolean;
  activeToolCalls?: { name: string; success?: boolean }[];
  onPlayAudio?: (text: string) => void;
  onStopAudio?: () => void;
  isSpeaking?: boolean;
  voiceTtsAvailable?: boolean;
  voiceUnavailableHint?: string;
}

export function MessageList({
  messages,
  isLoading,
  activeToolCalls,
  onPlayAudio,
  onStopAudio,
  isSpeaking,
  voiceTtsAvailable,
  voiceUnavailableHint,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, activeToolCalls]);

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
          <span className="text-3xl">💬</span>
        </div>
        <div>
          <h2 className="text-xl font-semibold">有什么可以帮你的？</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            输入文字或点击麦克风开始语音对话
          </p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1">
      <div className="mx-auto max-w-3xl">
        {messages
          .filter((m) => !m.isStreaming)
          .map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              onPlayAudio={
                message.role === "assistant" ? onPlayAudio : undefined
              }
              onStopAudio={message.role === "assistant" ? onStopAudio : undefined}
              isSpeaking={isSpeaking}
              voiceTtsAvailable={voiceTtsAvailable}
              voiceUnavailableHint={voiceUnavailableHint}
            />
          ))}

        {isLoading && <LoadingMessage toolCalls={activeToolCalls} />}

        <div ref={bottomRef} className="h-4" />
      </div>
    </ScrollArea>
  );
}
