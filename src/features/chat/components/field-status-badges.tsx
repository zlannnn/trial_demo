"use client";

import { cn } from "~/lib/utils";

import type { ConfirmationTaskStatus } from "../types";

interface FieldStatusBadgesProps {
  tasks: ConfirmationTaskStatus[];
  compact?: boolean;
  className?: string;
}

export function FieldStatusBadges({
  tasks,
  compact = false,
  className,
}: FieldStatusBadgesProps) {
  const dataTasks = tasks.filter((t) => t.id !== "finalize");

  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {dataTasks.map((task) => (
        <span
          key={task.id}
          title={
            task.completed
              ? `${task.label}：${task.value ?? "已获取"}`
              : `${task.label}：未获取`
          }
          className={cn(
            "inline-flex items-center rounded-md border px-1.5 py-0.5 font-medium leading-none",
            compact ? "text-[9px]" : "text-[10px]",
            task.completed ? "field-obtained" : "field-missing",
          )}
        >
          {compact ? task.label.replace(/^确认/, "") : task.label}
        </span>
      ))}
    </div>
  );
}

interface FieldStatusListProps {
  tasks: ConfirmationTaskStatus[];
  className?: string;
}

export function FieldStatusList({ tasks, className }: FieldStatusListProps) {
  return (
    <ul className={cn("space-y-1.5", className)}>
      {tasks.map((task) => (
        <li
          key={task.id}
          className={cn(
            "flex items-start justify-between gap-2 rounded-lg border px-3 py-2 text-xs",
            task.completed ? "field-obtained" : "field-missing",
          )}
        >
          <span className="font-medium">{task.label}</span>
          <span className="text-right text-[11px] opacity-90">
            {task.completed
              ? task.id === "finalize"
                ? "已完成"
                : (task.value ?? "已获取")
              : "未获取"}
          </span>
        </li>
      ))}
    </ul>
  );
}
