"use client";

import { PhoneCall, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { Button } from "~/components/ui/button";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Skeleton } from "~/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { cn } from "~/lib/utils";

import type { ConversationSummary } from "../types";
import { FieldStatusBadges } from "./field-status-badges";

interface ConversationItemProps {
  conversation: ConversationSummary;
  isActive: boolean;
  isDeleting?: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ConversationItem({
  conversation,
  isActive,
  isDeleting,
  onSelect,
  onDelete,
}: ConversationItemProps) {
  const [confirming, setConfirming] = useState(false);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirming(true);
  };

  const handleConfirmDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirming(false);
    onDelete(conversation.id);
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirming(false);
  };

  return (
    <div
      className={cn(
        "group relative flex w-full items-start gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition-all",
        "hover:bg-primary/5 hover:border-primary/20 border-transparent",
        isActive && "bg-primary/10 border-primary/25 ghost-glow",
        confirming && "border-destructive/30 bg-destructive/5",
      )}
    >
      <button
        type="button"
        onClick={() => onSelect(conversation.id)}
        disabled={isDeleting || confirming}
        className="flex min-w-0 flex-1 items-start gap-3 text-left"
      >
        <PhoneCall
          className={cn(
            "mt-0.5 h-4 w-4 shrink-0",
            isActive ? "text-primary" : "text-muted-foreground",
          )}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-foreground/90">
            {conversation.preview}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {formatRelativeTime(conversation.startedAt)} ·{" "}
            {conversation.messageCount} 轮对话 ·{" "}
            {conversation.fields.completedCount}/{conversation.fields.totalCount}
          </p>
          <FieldStatusBadges
            tasks={conversation.fields.tasks}
            compact
            className="mt-2"
          />
        </div>
      </button>

      {confirming ? (
        <div
          className="flex shrink-0 flex-col items-end gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="text-[10px] text-red-300/80">确认删除？</span>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={handleCancelDelete}
              disabled={isDeleting}
            >
              取消
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              删除
            </Button>
          </div>
        </div>
      ) : (
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={cn(
                  "h-7 w-7 shrink-0 text-muted-foreground/50 transition-colors",
                  "hover:bg-red-500/10 hover:text-red-400",
                  isActive && "text-muted-foreground/70",
                )}
                onClick={handleDeleteClick}
                disabled={isDeleting}
                aria-label="删除此会话"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>删除此会话</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}

interface ConversationListProps {
  conversations: ConversationSummary[];
  activeId?: string;
  isLoading?: boolean;
  isDeleting?: boolean;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onDelete: (id: string) => void;
  onDeleteAll: () => void;
}

export function ConversationList({
  conversations,
  activeId,
  isLoading,
  isDeleting,
  onSelect,
  onNewChat,
  onDelete,
  onDeleteAll,
}: ConversationListProps) {
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);

  const handleDeleteAll = () => {
    setConfirmDeleteAll(false);
    onDeleteAll();
  };

  return (
    <div className="flex h-full flex-col">
      <div className="p-3">
        <Button
          onClick={onNewChat}
          disabled={isDeleting}
          className="w-full justify-start gap-2 shadow-sm"
        >
          <Plus className="h-4 w-4" />
          新建外呼会话
        </Button>
      </div>

      <div className="flex items-center justify-between px-4 pb-2">
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
          外呼记录
        </p>
        {!isLoading && conversations.length > 0 && (
          confirmDeleteAll ? (
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-[10px] text-muted-foreground"
                onClick={() => setConfirmDeleteAll(false)}
                disabled={isDeleting}
              >
                取消
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-[10px] text-red-400 hover:bg-red-500/10 hover:text-red-300"
                onClick={handleDeleteAll}
                disabled={isDeleting}
              >
                确认清空
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-[10px] text-muted-foreground hover:text-red-400"
              onClick={() => setConfirmDeleteAll(true)}
              disabled={isDeleting}
            >
              清空全部
            </Button>
          )
        )}
      </div>

      <ScrollArea className="flex-1 px-2">
        {isLoading ? (
          <div className="space-y-2 p-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton
                key={i}
                className="h-14 w-full rounded-xl bg-secondary/50"
              />
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <p className="p-4 text-center text-sm text-muted-foreground">
            暂无外呼记录
            <span className="mt-1 block text-xs text-muted-foreground/60">
              点击上方按钮开始新的外呼会话
            </span>
          </p>
        ) : (
          <div className="space-y-1 pb-4">
            {conversations.map((conv) => (
              <ConversationItem
                key={conv.id}
                conversation={conv}
                isActive={conv.id === activeId}
                isDeleting={isDeleting}
                onSelect={onSelect}
                onDelete={onDelete}
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
