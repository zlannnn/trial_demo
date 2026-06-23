"use client";

import { Loader2 } from "lucide-react";

interface LoadingMessageProps {
  toolCalls?: { name: string; success?: boolean }[];
}

export function LoadingMessage({ toolCalls }: LoadingMessageProps) {
  return (
    <div className="flex gap-3 bg-muted/30 px-4 py-6 md:px-6">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
      <div className="space-y-3">
        <span className="text-sm font-medium text-muted-foreground">
          AI 正在思考…
        </span>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 animate-pulse-dot rounded-full bg-muted-foreground/60 [animation-delay:0ms]" />
          <span className="h-2 w-2 animate-pulse-dot rounded-full bg-muted-foreground/60 [animation-delay:200ms]" />
          <span className="h-2 w-2 animate-pulse-dot rounded-full bg-muted-foreground/60 [animation-delay:400ms]" />
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
    <div className="rounded-lg border border-border bg-background/80 p-3">
      <p className="mb-2 text-xs font-medium text-muted-foreground">
        工具调用
      </p>
      <div className="space-y-1.5">
        {toolCalls.map((tool, i) => (
          <div
            key={`${tool.name}-${i}`}
            className="flex items-center gap-2 text-xs"
          >
            <Loader2 className="h-3 w-3 animate-spin text-amber-500" />
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono">
              {tool.name}()
            </code>
            {tool.success !== undefined && (
              <span
                className={
                  tool.success ? "text-emerald-600" : "text-destructive"
                }
              >
                {tool.success ? "成功" : "失败"}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
