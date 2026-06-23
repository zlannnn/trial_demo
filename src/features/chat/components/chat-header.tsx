"use client";

import { Database, Menu, Mic, Phone, Radio, Trash2 } from "lucide-react";
import { useState } from "react";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { SignOutButton } from "~/components/auth-buttons";
import { cn } from "~/lib/utils";

import { BRAND } from "../constants/branding";

interface ChatHeaderProps {
  isLoading?: boolean;
  isRecording?: boolean;
  isSpeaking?: boolean;
  voiceSttAvailable?: boolean;
  voiceTtsAvailable?: boolean;
  model?: string;
  activeConversationId?: string;
  isDeleting?: boolean;
  onDeleteActive?: () => void;
}

export function ChatHeader({
  isLoading,
  isRecording,
  isSpeaking,
  voiceSttAvailable,
  voiceTtsAvailable,
  model,
  activeConversationId,
  isDeleting,
  onDeleteActive,
}: ChatHeaderProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const callStatus = isRecording
    ? "客户发言中"
    : isSpeaking
      ? "AI 应答中"
      : isLoading
        ? "处理中"
        : "待机";

  return (
    <header className="hidden shrink-0 border-b border-border/60 bg-card/30 backdrop-blur-md md:block">
      <div className="flex h-14 items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/30 to-teal-600/20 ghost-border">
            <Phone className="h-4 w-4 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold tracking-tight">
                {BRAND.name}
              </span>
              <Badge
                variant="outline"
                className="border-cyan-500/30 bg-cyan-500/10 text-[10px] text-cyan-300"
              >
                {BRAND.scenario}
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {BRAND.company} · 语音 AI 契约确认演示
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {activeConversationId && onDeleteActive && (
            confirmDelete ? (
              <div className="flex items-center gap-1 rounded-lg border border-red-500/30 bg-red-500/5 px-2 py-1">
                <span className="text-xs text-red-300">删除当前会话？</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => setConfirmDelete(false)}
                  disabled={isDeleting}
                >
                  取消
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-red-400 hover:bg-red-500/10"
                  onClick={() => {
                    setConfirmDelete(false);
                    onDeleteActive();
                  }}
                  disabled={isDeleting}
                >
                  删除
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-1.5 text-xs text-muted-foreground hover:bg-red-500/10 hover:text-red-400"
                onClick={() => setConfirmDelete(true)}
                disabled={isDeleting || isLoading}
              >
                <Trash2 className="h-3.5 w-3.5" />
                删除会话
              </Button>
            )
          )}
          <StatusPill
            icon={Radio}
            label={callStatus}
            active={isRecording || isSpeaking || isLoading}
            activeColor="text-cyan-400"
          />
          <StatusPill
            icon={Mic}
            label={voiceSttAvailable ? "STT 就绪" : "STT 未配置"}
            active={voiceSttAvailable}
          />
          <StatusPill
            icon={Phone}
            label={voiceTtsAvailable ? "TTS 就绪" : "TTS 未配置"}
            active={voiceTtsAvailable}
          />
          <StatusPill icon={Database} label="保单库已连接" active />
          <SignOutButton />
        </div>
      </div>
      {model && (
        <div className="border-t border-border/40 px-6 py-1">
          <p className="text-[10px] text-muted-foreground/60">
            LLM · {model}
          </p>
        </div>
      )}
    </header>
  );
}

function StatusPill({
  icon: Icon,
  label,
  active,
  activeColor = "text-emerald-400",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active?: boolean;
  activeColor?: string;
}) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          active ? "bg-emerald-400 shadow-[0_0_6px] shadow-emerald-400/50" : "bg-muted-foreground/40",
        )}
      />
      <Icon className={cn("h-3 w-3", active && activeColor)} />
      <span>{label}</span>
    </div>
  );
}

export function MobileHeaderBar({
  onMenuClick,
  onNewChat,
  onDeleteActive,
  isRecording,
  hasActiveConversation,
  isDeleting,
}: {
  onMenuClick: () => void;
  onNewChat: () => void;
  onDeleteActive?: () => void;
  isRecording?: boolean;
  hasActiveConversation?: boolean;
  isDeleting?: boolean;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <header className="flex h-14 items-center justify-between border-b border-border/60 bg-card/30 px-4 backdrop-blur-md md:hidden">
      <button
        type="button"
        onClick={onMenuClick}
        className="rounded-lg p-2 text-muted-foreground hover:bg-secondary"
      >
        <Menu className="h-5 w-5" />
      </button>
      <div className="text-center">
        <p className="text-sm font-semibold text-gradient-ghost">{BRAND.name}</p>
        <p className="text-[10px] text-muted-foreground">
          {isRecording ? "● 录音中" : confirmDelete ? "确认删除当前会话？" : BRAND.scenario}
        </p>
      </div>
      <div className="flex items-center gap-1">
        {confirmDelete ? (
          <>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="rounded-lg px-2 py-1 text-xs text-muted-foreground"
            >
              取消
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirmDelete(false);
                onDeleteActive?.();
              }}
              disabled={isDeleting}
              className="rounded-lg px-2 py-1 text-xs text-red-400"
            >
              删除
            </button>
          </>
        ) : (
          <>
            {hasActiveConversation && onDeleteActive && (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                disabled={isDeleting}
                className="rounded-lg p-2 text-muted-foreground hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
                aria-label="删除当前会话"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            )}
            <button
              type="button"
              onClick={onNewChat}
              className="rounded-lg p-2 text-muted-foreground hover:bg-secondary"
            >
              <Phone className="h-5 w-5" />
            </button>
          </>
        )}
      </div>
    </header>
  );
}
