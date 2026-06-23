"use client";

import { Volume2, VolumeX } from "lucide-react";

import { Button } from "~/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { cn } from "~/lib/utils";

interface AudioPlayButtonProps {
  isPlaying?: boolean;
  disabled?: boolean;
  disabledReason?: string;
  onPlay: () => void;
  onStop?: () => void;
  className?: string;
}

export function AudioPlayButton({
  isPlaying,
  disabled,
  disabledReason,
  onPlay,
  onStop,
  className,
}: AudioPlayButtonProps) {
  const button = (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn("h-7 w-7", className)}
      onClick={disabled ? undefined : isPlaying ? onStop : onPlay}
      disabled={disabled}
      aria-label={isPlaying ? "停止播放" : "播放语音"}
    >
      {isPlaying ? (
        <VolumeX className="h-3.5 w-3.5" />
      ) : (
        <Volume2 className="h-3.5 w-3.5" />
      )}
    </Button>
  );

  if (disabled && disabledReason) {
    return (
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent>{disabledReason}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return button;
}
