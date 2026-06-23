"use client";

import { Bot, User, Wrench } from "lucide-react";

import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { cn } from "~/lib/utils";

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
        "group flex gap-3 px-4 py-6 md:px-6",
        isUser ? "bg-transparent" : "bg-muted/30",
      )}
    >
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback
          className={cn(
            "text-xs",
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-emerald-600 text-white",
          )}
        >
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {isUser ? "你" : "AI 助手"}
          </span>
          {!isUser && message.content && (
            <AudioPlayButton
              isPlaying={isSpeaking}
              disabled={!voiceTtsAvailable}
              disabledReason={voiceUnavailableHint}
              onPlay={() => onPlayAudio?.(message.content)}
              onStop={onStopAudio}
            />
          )}
        </div>

        <div className="prose prose-sm max-w-none dark:prose-invert">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
            {message.content}
          </p>
        </div>

        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {message.toolCalls.map((tool) => (
              <Badge
                key={tool.callId}
                variant={tool.success ? "success" : "destructive"}
                className="gap-1 font-normal"
              >
                <Wrench className="h-3 w-3" />
                {formatToolName(tool.name)}
                {tool.success ? " ✓" : " ✗"}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function formatToolName(name: string): string {
  const labels: Record<string, string> = {
    createUserProfile: "创建档案",
    updateUserProfile: "更新档案",
    getUserProfile: "读取档案",
    createConversation: "创建会话",
    saveMessage: "保存消息",
    searchConversationHistory: "搜索历史",
  };
  return labels[name] ?? name;
}
