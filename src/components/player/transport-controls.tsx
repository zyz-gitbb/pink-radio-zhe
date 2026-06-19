"use client";

import { Play, Pause, SkipBack, SkipForward } from "lucide-react";
import { formatTime } from "@/lib/utils";

interface TransportControlsProps {
  isPlaying: boolean;
  progress: number;
  duration: number;
  onPrev: () => void;
  onTogglePlay: () => void;
  onNext: () => void;
}

export const TransportControls = function TransportControls({
  isPlaying,
  progress,
  duration,
  onPrev,
  onTogglePlay,
  onNext,
}: TransportControlsProps) {
  return (
    <div className="mx-auto flex max-w-2xl flex-1 flex-col items-center">
      <div className="flex items-center gap-6">
        <button
          onClick={onPrev}
          className="text-text-secondary hover:text-text-primary transition-colors"
        >
          <SkipBack size={18} strokeWidth={1.5} />
        </button>

        <button
          onClick={onTogglePlay}
          className="bg-accent hover:bg-accent-dim shadow-accent/25 flex h-9 w-9 items-center justify-center rounded-full text-white shadow-md transition-all hover:scale-105"
        >
          {isPlaying ? (
            <Pause size={16} fill="currentColor" />
          ) : (
            <Play size={16} fill="currentColor" className="ml-0.5" />
          )}
        </button>

        <button
          onClick={onNext}
          className="text-text-secondary hover:text-text-primary transition-colors"
        >
          <SkipForward size={18} strokeWidth={1.5} />
        </button>
      </div>

      {/* 时间显示 */}
      <div className="mt-1 flex items-center gap-3">
        <span className="text-text-secondary/60 w-10 text-right font-mono text-[10px] tabular-nums">
          {formatTime(progress * 1000)}
        </span>
        <span className="text-text-secondary/30 text-[10px]">/</span>
        <span className="text-text-secondary/60 w-10 font-mono text-[10px] tabular-nums">
          {formatTime(duration * 1000)}
        </span>
      </div>
    </div>
  );
};
