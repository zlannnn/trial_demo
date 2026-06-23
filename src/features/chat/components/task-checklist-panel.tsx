"use client";

import {
  CheckCircle2,
  Circle,
  ClipboardCheck,
  Loader2,
  PartyPopper,
  Sparkles,
} from "lucide-react";
import { useState } from "react";

import { Badge } from "~/components/ui/badge";
import { ScrollArea } from "~/components/ui/scroll-area";
import { cn } from "~/lib/utils";

import type { TaskProgress } from "../types";

interface TaskChecklistPanelProps {
  taskProgress: TaskProgress | null;
  isLoading?: boolean;
  hasActiveConversation?: boolean;
  variant?: "desktop" | "mobile";
  className?: string;
}

export function TaskChecklistPanel({
  taskProgress,
  isLoading,
  hasActiveConversation,
  variant = "desktop",
  className,
}: TaskChecklistPanelProps) {
  const [mobileExpanded, setMobileExpanded] = useState(false);

  if (variant === "mobile") {
    if (!hasActiveConversation) return null;
    if (!taskProgress) return null;

    const { completedCount, totalCount, finalized } = taskProgress;

    return (
      <div
        className={cn(
          "border-t border-border/60 bg-card/30 backdrop-blur-md lg:hidden",
          className,
        )}
      >
        <button
          type="button"
          onClick={() => setMobileExpanded((v) => !v)}
          className="flex w-full items-center justify-between px-4 py-3"
        >
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-cyan-400" />
            <span className="text-sm font-medium">契约确认任务</span>
            <Badge
              variant="outline"
              className={cn(
                "border-cyan-500/30 text-[10px]",
                finalized && "border-emerald-500/30 text-emerald-400",
              )}
            >
              {completedCount}/{totalCount}
            </Badge>
          </div>
          <span className="text-xs text-muted-foreground">
            {mobileExpanded ? "收起" : "展开"}
          </span>
        </button>
        {mobileExpanded && (
          <div className="max-h-64 overflow-y-auto border-t border-border/40">
            <TaskPanelBody taskProgress={taskProgress} isLoading={isLoading} />
          </div>
        )}
      </div>
    );
  }

  return (
    <aside
      className={cn(
        "hidden w-72 shrink-0 flex-col border-l border-border/60 bg-card/20 backdrop-blur-md lg:flex",
        className,
      )}
    >
      <PanelHeader />
      {!hasActiveConversation ? (
        <EmptyTaskState message="请选择或新建外呼会话" />
      ) : !taskProgress ? (
        <div className="flex flex-1 items-center justify-center p-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <TaskPanelBody taskProgress={taskProgress} isLoading={isLoading} />
      )}
    </aside>
  );
}

function TaskPanelBody({
  taskProgress,
  isLoading,
}: {
  taskProgress: TaskProgress;
  isLoading?: boolean;
}) {
  const { tasks, completedCount, totalCount, progressPercent, finalized, nextPendingTask } =
    taskProgress;

  return (
    <>
      <div className="px-4 py-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-xs text-muted-foreground">确认进度</p>
            <p className="text-2xl font-bold tabular-nums text-gradient-ghost">
              {completedCount}
              <span className="text-base font-normal text-muted-foreground">
                /{totalCount}
              </span>
            </p>
          </div>
          <ProgressRing percent={progressPercent} finalized={finalized} />
        </div>

        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-secondary/60">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              finalized
                ? "bg-gradient-to-r from-emerald-500 to-cyan-400"
                : "bg-gradient-to-r from-cyan-500 to-teal-400",
            )}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {finalized ? (
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3">
            <PartyPopper className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
            <div>
              <p className="text-xs font-medium text-emerald-300">
                契约确认已完成
              </p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-emerald-200/70">
                全部信息已入库，客户可以结束通话
              </p>
            </div>
          </div>
        ) : nextPendingTask ? (
          <div className="mt-3 rounded-xl ghost-border bg-cyan-500/5 p-3">
            <p className="text-[10px] font-medium uppercase tracking-wider text-cyan-400/80">
              当前推进
            </p>
            <p className="mt-1 text-xs font-medium text-foreground/90">
              {nextPendingTask.label}
            </p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
              {nextPendingTask.hint}
            </p>
          </div>
        ) : null}
      </div>

      <ScrollArea className="flex-1 px-3">
        <ul className="space-y-1 pb-4">
          {tasks.map((task) => {
            const isCurrent =
              !finalized &&
              nextPendingTask?.id === task.id &&
              !task.completed;

            return (
              <li
                key={task.id}
                className={cn(
                  "flex items-start gap-2.5 rounded-xl px-3 py-2.5 transition-colors",
                  task.completed && "opacity-80",
                  isCurrent && "bg-cyan-500/10 ghost-border",
                )}
              >
                <TaskIcon
                  completed={task.completed}
                  isCurrent={isCurrent}
                  isFinalize={task.id === "finalize"}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p
                      className={cn(
                        "text-xs font-medium",
                        task.completed
                          ? "text-emerald-400/90 line-through decoration-emerald-500/40"
                          : isCurrent
                            ? "text-cyan-200"
                            : "text-foreground/80",
                      )}
                    >
                      {task.label}
                    </p>
                    {isCurrent && isLoading && (
                      <Loader2 className="h-3 w-3 animate-spin text-cyan-400" />
                    )}
                  </div>
                  {task.completed && task.value && task.id !== "finalize" && (
                    <p className="mt-0.5 truncate text-[10px] text-emerald-300/60">
                      {task.value}
                    </p>
                  )}
                  {task.id === "finalize" && task.completed && (
                    <p className="mt-0.5 text-[10px] text-emerald-300/60">
                      已正式入库
                    </p>
                  )}
                  {!task.completed && isCurrent && (
                    <p className="mt-0.5 text-[10px] text-muted-foreground/70">
                      {task.hint}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </ScrollArea>
    </>
  );
}

function PanelHeader() {
  return (
    <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3">
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/10">
        <ClipboardCheck className="h-3.5 w-3.5 text-cyan-400" />
      </div>
      <div>
        <p className="text-sm font-semibold">本次外呼任务</p>
        <p className="text-[10px] text-muted-foreground">随会话切换，独立进度</p>
      </div>
    </div>
  );
}

function EmptyTaskState({ message }: { message: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
      <Circle className="h-8 w-8 text-muted-foreground/30" />
      <p className="text-xs text-muted-foreground">{message}</p>
      <p className="text-[10px] text-muted-foreground/60">
        每个外呼会话拥有独立的确认清单
      </p>
    </div>
  );
}

function ProgressRing({
  percent,
  finalized,
}: {
  percent: number;
  finalized: boolean;
}) {
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative h-12 w-12">
      <svg className="h-12 w-12 -rotate-90" viewBox="0 0 48 48">
        <circle
          cx="24"
          cy="24"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          className="text-secondary/60"
        />
        <circle
          cx="24"
          cy="24"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn(
            "transition-all duration-500",
            finalized ? "text-emerald-400" : "text-cyan-400",
          )}
        />
      </svg>
      <span
        className={cn(
          "absolute inset-0 flex items-center justify-center text-[10px] font-bold tabular-nums",
          finalized ? "text-emerald-400" : "text-cyan-300",
        )}
      >
        {percent}%
      </span>
    </div>
  );
}

function TaskIcon({
  completed,
  isCurrent,
  isFinalize,
}: {
  completed: boolean;
  isCurrent: boolean;
  isFinalize: boolean;
}) {
  if (completed) {
    return (
      <CheckCircle2
        className={cn(
          "mt-0.5 h-4 w-4 shrink-0",
          isFinalize ? "text-emerald-400" : "text-emerald-400/90",
        )}
      />
    );
  }

  if (isCurrent) {
    return (
      <div className="relative mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center">
        <Sparkles className="h-4 w-4 text-cyan-400" />
      </div>
    );
  }

  return (
    <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/40" />
  );
}
