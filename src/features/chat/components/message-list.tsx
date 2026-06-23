"use client";

import { useEffect, useRef } from "react";

import { ScrollArea } from "~/components/ui/scroll-area";

import type { ChatMessage } from "../types";
import { LoadingMessage } from "./loading-message";
import { MessageBubble } from "./message-bubble";
import { WelcomePanel } from "./welcome-panel";

interface MessageListProps {
  messages: ChatMessage[];
  isLoading?: boolean;
  activeToolCalls?: { name: string; success?: boolean }[];
  onPlayAudio?: (text: string) => void;
  onStopAudio?: () => void;
  isSpeaking?: boolean;
  voiceTtsAvailable?: boolean;
  voiceUnavailableHint?: string;
  onQuickPrompt?: (text: string) => void;
  voiceSttAvailable?: boolean;
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
  onQuickPrompt,
  voiceSttAvailable,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, activeToolCalls]);

  if (messages.length === 0 && !isLoading && onQuickPrompt) {
    return (
      <WelcomePanel
        onQuickPrompt={onQuickPrompt}
        voiceSttAvailable={voiceSttAvailable}
      />
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
