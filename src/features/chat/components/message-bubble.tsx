"use client";

import { Headphones, User, Wrench } from "lucide-react";

import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { cn } from "~/lib/utils";

import { TOOL_LABELS } from "../constants/branding";
import type { ChatMessage } from "../types";
import { AudioPlayButton } from "./audio-play-button";

interface MessageBubbleProps {
  message: ChatMessage;
  onPlayAudio?: (text: string) => void;
  onStopAudio?: () => void;
  isSpeaking?: boolean;
  voiceTtsAvailable?: boolean;
  voiceUnavailableHint?: string;
}

export function MessageBubble({
  message,
  onPlayAudio,
  onStopAudio,
  isSpeaking,
  voiceTtsAvailable = false,
  voiceUnavailableHint,
}: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "group flex gap-3 px-4 py-5 md:px-6",
        !isUser && "bg-gradient-to-r from-primary/[0.04] to-transparent",
      )}
    >
      <Avatar className="h-9 w-9 shrink-0 ring-2 ring-border/50">
        <AvatarFallback
          className={cn(
            "text-xs",
            isUser
              ? "bg-secondary text-secondary-foreground"
              : "bg-gradient-to-br from-primary/15 to-teal-500/10 text-primary",
          )}
        >
          {isUser ? (
            <User className="h-4 w-4" />
          ) : (
            <Headphones className="h-4 w-4" />
          )}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-sm font-medium",
              !isUser && "text-primary",
            )}
          >
            {isUser ? "客户" : "J-Ghost 专员"}
          </span>
          {!isUser && message.content && (
            <AudioPlayButton
              isPlaying={isSpeaking}
              disabled={!voiceTtsAvailable}
              disabledReason={voiceUnavailableHint}
              onPlay={() => onPlayAudio?.(message.content)}
              onStop={onStopAudio}
              className="text-primary/80 hover:text-primary"
            />
          )}
        </div>

        <div
          className={cn(
            "rounded-2xl px-4 py-3 text-sm leading-relaxed",
            isUser
              ? "bg-secondary/60 text-foreground/90"
              : "ghost-border bg-card/60 text-foreground/95 backdrop-blur-sm",
          )}
        >
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>

        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {message.toolCalls.map((tool) => (
              <Badge
                key={tool.callId}
                variant={tool.success ? "success" : "destructive"}
                className="gap-1 border-0 bg-primary/10 font-normal text-primary"
              >
                <Wrench className="h-3 w-3" />
                {TOOL_LABELS[tool.name] ?? tool.name}
                {tool.success ? " ✓" : " ✗"}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
