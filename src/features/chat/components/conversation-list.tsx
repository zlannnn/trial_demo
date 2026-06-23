"use client";

import { MessageSquare, Plus } from "lucide-react";

import { Button } from "~/components/ui/button";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Skeleton } from "~/components/ui/skeleton";
import { cn } from "~/lib/utils";

import type { ConversationSummary } from "../types";

interface ConversationItemProps {
  conversation: ConversationSummary;
  isActive: boolean;
  onSelect: (id: string) => void;
}

export function ConversationItem({
  conversation,
  isActive,
  onSelect,
}: ConversationItemProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(conversation.id)}
      className={cn(
        "flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-sidebar-accent",
        isActive && "bg-sidebar-accent",
      )}
    >
      <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{conversation.preview}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {formatRelativeTime(conversation.startedAt)} ·{" "}
          {conversation.messageCount} 条消息
        </p>
      </div>
    </button>
  );
}

interface ConversationListProps {
  conversations: ConversationSummary[];
  activeId?: string;
  isLoading?: boolean;
  onSelect: (id: string) => void;
  onNewChat: () => void;
}

export function ConversationList({
  conversations,
  activeId,
  isLoading,
  onSelect,
  onNewChat,
}: ConversationListProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="p-3">
        <Button
          onClick={onNewChat}
          className="w-full justify-start gap-2"
          variant="outline"
        >
          <Plus className="h-4 w-4" />
          新对话
        </Button>
      </div>

      <ScrollArea className="flex-1 px-2">
        {isLoading ? (
          <div className="space-y-2 p-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <p className="p-4 text-center text-sm text-muted-foreground">
            暂无历史会话
          </p>
        ) : (
          <div className="space-y-0.5 pb-4">
            {conversations.map((conv) => (
              <ConversationItem
                key={conv.id}
                conversation={conv}
                isActive={conv.id === activeId}
                onSelect={onSelect}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "今天";
  if (diffDays === 1) return "昨天";
  if (diffDays < 7) return `${diffDays} 天前`;
  return date.toLocaleDateString("zh-CN");
}
