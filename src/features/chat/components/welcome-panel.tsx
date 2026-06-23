"use client";

import {
  Brain,
  Database,
  Hand,
  Mic,
  Phone,
  Sparkles,
  Waves,
} from "lucide-react";

import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

import { BRAND, CAPABILITIES, DEMO_PROMPTS } from "../constants/branding";

const ICON_MAP = {
  wave: Waves,
  interrupt: Hand,
  brain: Brain,
  database: Database,
} as const;

interface WelcomePanelProps {
  onQuickPrompt: (text: string) => void;
  voiceSttAvailable?: boolean;
}

export function WelcomePanel({
  onQuickPrompt,
  voiceSttAvailable,
}: WelcomePanelProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-8 md:px-8">
      <div className="mx-auto w-full max-w-2xl space-y-8 text-center">
        {/* Logo / Hero */}
        <div className="space-y-4">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl ghost-glow ghost-border bg-gradient-to-br from-cyan-500/20 to-teal-600/10">
            <Sparkles className="h-10 w-10 text-cyan-400" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-cyan-400/80">
              {BRAND.company} · {BRAND.tagline}
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
              <span className="text-gradient-ghost">{BRAND.name}</span>
            </h1>
            <p className="mt-3 text-base text-muted-foreground">
              {BRAND.scenario}
            </p>
            <p className="mt-1 text-sm text-muted-foreground/70">
              {BRAND.scenarioDesc}
            </p>
          </div>
        </div>

        {/* Capabilities grid */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {CAPABILITIES.map((cap) => {
            const Icon = ICON_MAP[cap.icon];
            return (
              <div
                key={cap.title}
                className="rounded-xl border border-border/60 bg-card/50 p-4 text-left backdrop-blur-sm transition-colors hover:border-cyan-500/30"
              >
                <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10">
                  <Icon className="h-4 w-4 text-cyan-400" />
                </div>
                <p className="text-sm font-medium text-foreground">{cap.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {cap.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* Quick demo prompts */}
        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground">
            演示对话 — 点击快速开始
          </p>
          <div className="flex flex-col gap-2">
            {DEMO_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => onQuickPrompt(prompt)}
                className={cn(
                  "rounded-xl border border-border/60 bg-secondary/40 px-4 py-3 text-left text-sm",
                  "transition-all hover:border-cyan-500/40 hover:bg-cyan-500/5",
                )}
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* CTA hint */}
        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Mic className={cn("h-3.5 w-3.5", voiceSttAvailable && "text-cyan-400")} />
            语音输入
          </span>
          <span className="text-border">|</span>
          <span className="flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5 text-cyan-400/60" />
            模拟外呼对话
          </span>
        </div>
      </div>
    </div>
  );
}

interface QuickPromptBarProps {
  onSelect: (text: string) => void;
  className?: string;
}

export function QuickPromptBar({ onSelect, className }: QuickPromptBarProps) {
  return (
    <div className={cn("flex gap-2 overflow-x-auto pb-1", className)}>
      {DEMO_PROMPTS.slice(0, 3).map((prompt) => (
        <Button
          key={prompt}
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 border-border/60 bg-secondary/30 text-xs hover:border-cyan-500/40 hover:bg-cyan-500/5"
          onClick={() => onSelect(prompt)}
        >
          {prompt.length > 20 ? `${prompt.slice(0, 20)}…` : prompt}
        </Button>
      ))}
    </div>
  );
}
