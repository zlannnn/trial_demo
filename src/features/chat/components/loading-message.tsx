"use client";

import { Database, Loader2 } from "lucide-react";

import { TOOL_LABELS } from "../constants/branding";

interface LoadingMessageProps {
  toolCalls?: { name: string; success?: boolean }[];
}

export function LoadingMessage({ toolCalls }: LoadingMessageProps) {
  return (
    <div className="flex gap-3 bg-gradient-to-r from-cyan-500/[0.06] to-transparent px-4 py-5 md:px-6">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500/30 to-teal-600/20 ghost-border">
        <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
      </div>
      <div className="space-y-3">
        <div>
          <span className="text-sm font-medium text-cyan-300/80">
            J-Ghost 正在处理…
          </span>
          <p className="mt-0.5 text-xs text-muted-foreground">
            生成回复 · 必要时联动保单数据库
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 animate-pulse-dot rounded-full bg-cyan-400/70 [animation-delay:0ms]" />
          <span className="h-2 w-2 animate-pulse-dot rounded-full bg-cyan-400/70 [animation-delay:200ms]" />
          <span className="h-2 w-2 animate-pulse-dot rounded-full bg-cyan-400/70 [animation-delay:400ms]" />
        </div>
        {toolCalls && toolCalls.length > 0 && (
          <ToolCallStatus toolCalls={toolCalls} />
        )}
      </div>
    </div>
  );
}

interface ToolCallStatusProps {
  toolCalls: { name: string; success?: boolean }[];
}

export function ToolCallStatus({ toolCalls }: ToolCallStatusProps) {
  return (
    <div className="rounded-xl ghost-border bg-card/50 p-3 backdrop-blur-sm">
      <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-cyan-400/80">
        <Database className="h-3 w-3" />
        业务系统联动
      </p>
      <div className="space-y-1.5">
        {toolCalls.map((tool, i) => (
          <div
            key={`${tool.name}-${i}`}
            className="flex items-center gap-2 text-xs text-muted-foreground"
          >
            <Loader2 className="h-3 w-3 animate-spin text-amber-400" />
            <span>{TOOL_LABELS[tool.name] ?? tool.name}</span>
            {tool.success !== undefined && (
              <span
                className={
                  tool.success ? "text-emerald-400" : "text-destructive"
                }
              >
                {tool.success ? "完成" : "失败"}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
