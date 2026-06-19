"use client";

import { AnimatePresence } from "framer-motion";
import { Volume2, VolumeX, Repeat, Repeat1, Shuffle, Mic2, MessageSquare, ListMusic, FolderPlus } from "lucide-react";
import { ChannelPickerPopover } from "@/components/channel-picker-popover";
import type { Song, PlayMode } from "@/types";

interface RightControlsProps {
  playMode: PlayMode;
  showLyrics: boolean;
  isCommentOpen: boolean;
  isQueueOpen: boolean;
  showPicker: boolean;
  currentSong: Song | null;
  volume: number;
  addBtnRef: React.RefObject<HTMLButtonElement | null>;
  queueBtnRef: React.RefObject<HTMLButtonElement | null>;
  onPlayModeToggle: () => void;
  onToggleLyrics: () => void;
  onToggleComment: () => void;
  onToggleQueue: () => void;
  setShowPicker: (v: boolean) => void;
  onMuteToggle: () => void;
  onVolumeChange: (v: number) => void;
}

export const RightControls = function RightControls({
  playMode,
  showLyrics,
  isCommentOpen,
  isQueueOpen,
  showPicker,
  currentSong,
  volume,
  addBtnRef,
  queueBtnRef,
  onPlayModeToggle,
  onToggleLyrics,
  onToggleComment,
  onToggleQueue,
  setShowPicker,
  onMuteToggle,
  onVolumeChange,
}: RightControlsProps) {
  return (
    <div className="flex w-64 items-center justify-end gap-4">
      <button
        onClick={onPlayModeToggle}
        className={`transition-colors ${playMode !== "sequential" ? "text-accent" : "text-text-secondary/40 hover:text-text-secondary"}`}
        title={
          playMode === "sequential"
            ? "顺序播放"
            : playMode === "random"
              ? "随机播放"
              : "单曲循环"
        }
      >
        {playMode === "sequential" ? (
          <Repeat size={15} strokeWidth={1.5} />
        ) : playMode === "random" ? (
          <Shuffle size={15} strokeWidth={1.5} />
        ) : (
          <Repeat1 size={15} strokeWidth={1.5} />
        )}
      </button>

      <button
        onClick={onToggleLyrics}
        className={`transition-colors ${showLyrics ? "text-accent" : "text-text-secondary/40 hover:text-text-secondary"}`}
        title="歌词"
      >
        <Mic2 size={15} strokeWidth={1.5} />
      </button>

      <button
        onClick={onToggleComment}
        className={`transition-colors ${isCommentOpen ? "text-accent" : "text-text-secondary/40 hover:text-text-secondary"}`}
        title="评论"
      >
        <MessageSquare size={15} strokeWidth={1.5} />
      </button>

      <button
        ref={queueBtnRef}
        onClick={onToggleQueue}
        className={`transition-colors ${isQueueOpen ? "text-accent" : "text-text-secondary/40 hover:text-text-secondary"}`}
        title="播放队列"
      >
        <ListMusic size={15} strokeWidth={1.5} />
      </button>

      {currentSong && (
        <>
          <button
            ref={addBtnRef}
            onClick={(e) => {
              e.stopPropagation();
              setShowPicker(!showPicker);
            }}
            className={`transition-colors ${showPicker ? "text-accent" : "text-text-secondary/40 hover:text-text-secondary"}`}
            title="收录到频道"
          >
            <FolderPlus size={15} strokeWidth={1.5} />
          </button>
          <AnimatePresence>
            {showPicker && (
              <ChannelPickerPopover
                songId={currentSong.id}
                songName={currentSong.name}
                triggerRef={addBtnRef}
                onClose={() => setShowPicker(false)}
              />
            )}
          </AnimatePresence>
        </>
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={onMuteToggle}
          className="text-text-secondary/40 hover:text-text-secondary transition-colors"
        >
          {volume === 0 ? (
            <VolumeX size={15} strokeWidth={1.5} />
          ) : (
            <Volume2 size={15} strokeWidth={1.5} />
          )}
        </button>
        <input
          type="range"
          min="0"
          max="100"
          value={volume}
          onChange={(e) => onVolumeChange(parseInt(e.target.value, 10))}
          className="bg-border/60 accent-accent h-[3px] w-20 cursor-pointer appearance-none rounded-lg"
        />
      </div>
    </div>
  );
};
