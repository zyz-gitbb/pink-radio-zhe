"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ListMusic, AudioLines, ListPlus, GripVertical, Trash2 } from "lucide-react";
import { formatTime } from "@/lib/utils";
import type { Song } from "@/types";

interface QueuePanelProps {
  isOpen: boolean;
  queueRef: React.RefObject<HTMLDivElement | null>;
  playlist: Song[];
  currentIndex: number;
  playSong: (song: Song) => void;
  playNext: (song: Song) => void;
  removeSong: (index: number) => void;
  reorderPlaylist: (fromIndex: number, toIndex: number) => void;
  setPlaylist: (songs: Song[]) => void;
}

export const QueuePanel = function QueuePanel({
  isOpen,
  queueRef,
  playlist,
  currentIndex,
  playSong,
  playNext,
  removeSong,
  reorderPlaylist,
  setPlaylist,
}: QueuePanelProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragItemRef = useRef<number | null>(null);

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    dragItemRef.current = index;
    setDragIndex(index);
    e.dataTransfer.effectAllowed = "move";
    // 设置拖拽图像为半透明
    if (e.currentTarget instanceof HTMLElement) {
      e.dataTransfer.setDragImage(e.currentTarget, 20, 20);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, toIndex: number) => {
      e.preventDefault();
      const fromIndex = dragItemRef.current;
      if (fromIndex !== null && fromIndex !== toIndex) {
        reorderPlaylist(fromIndex, toIndex);
      }
      setDragIndex(null);
      setDragOverIndex(null);
      dragItemRef.current = null;
    },
    [reorderPlaylist]
  );

  const handleDragEnd = useCallback(() => {
    setDragIndex(null);
    setDragOverIndex(null);
    dragItemRef.current = null;
  }, []);

  const handleClearQueue = () => {
    setPlaylist([]);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={queueRef}
          key="queue-panel"
          className="fixed right-4 bottom-24 z-50 flex max-h-[60vh] w-80 flex-col overflow-hidden rounded-2xl border border-white/50 bg-white/70 shadow-2xl backdrop-blur-xl"
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          {/* 头部 */}
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <div>
              <h3 className="text-sm font-semibold text-stone-800">当前播放</h3>
              <p className="mt-0.5 text-[11px] text-stone-400">{playlist.length} 首歌曲</p>
            </div>
            {playlist.length > 0 && (
              <button
                onClick={handleClearQueue}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-stone-400 transition-colors hover:bg-red-50 hover:text-red-400"
                title="清空队列"
              >
                <Trash2 size={12} />
                清空
              </button>
            )}
          </div>

          {/* 列表 */}
          <div className="scrollbar-hide flex-1 overflow-y-auto p-2">
            {playlist.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-stone-300">
                <ListMusic size={32} strokeWidth={1} />
                <p className="mt-2 text-xs">队列为空</p>
              </div>
            ) : (
              playlist.map((track, index) => {
                const isCurrent = index === currentIndex;
                const artists =
                  (track.ar || track.artists || []).map((a) => a.name).join(", ") || "未知艺术家";
                const isDragging = dragIndex === index;
                const isDragOver = dragOverIndex === index && dragIndex !== index;

                return (
                  <div
                    key={`${track.id}-${index}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                    onClick={() => !dragItemRef.current && playSong(track)}
                    className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 ${
                      isDragging
                        ? "scale-[0.98] opacity-50"
                        : isDragOver
                          ? "border-accent/40 border-y-2 border-dashed bg-accent/5"
                          : isCurrent
                            ? "bg-rose-50/60"
                            : "cursor-pointer hover:bg-black/[0.03]"
                    }`}
                  >
                    {/* 拖拽手柄 + 当前播放指示器 */}
                    <div className="flex w-4 flex-shrink-0 items-center justify-center">
                      {isCurrent ? (
                        <AudioLines size={14} className="text-accent animate-pulse" />
                      ) : (
                        <GripVertical
                          size={14}
                          className="cursor-grab text-stone-300 opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
                        />
                      )}
                    </div>

                    {/* 歌曲信息 */}
                    <div className="min-w-0 flex-1">
                      <p
                        className={`truncate text-[13px] ${isCurrent ? "font-semibold text-stone-800" : "text-stone-600"}`}
                      >
                        {track.name || "未知歌曲"}
                      </p>
                      <p className="truncate text-[11px] text-stone-400">{artists}</p>
                    </div>

                    {/* 时长 + 操作按钮 */}
                    <div className="flex flex-shrink-0 items-center gap-1">
                      <span className="font-mono text-[10px] text-stone-300 tabular-nums group-hover:hidden">
                        {formatTime(track.duration)}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          playNext(track);
                        }}
                        className="hover:text-accent hover:bg-accent/10 flex h-6 w-6 cursor-pointer items-center justify-center rounded-md text-stone-400 opacity-0 transition-all duration-200 group-hover:opacity-100"
                        title="下一首播放"
                      >
                        <ListPlus size={13} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSong(index);
                        }}
                        className="hover:text-accent hover:bg-accent/10 flex h-6 w-6 cursor-pointer items-center justify-center rounded-md text-stone-400 opacity-0 transition-all duration-200 group-hover:opacity-100"
                        title="移出队列"
                      >
                        <X size={13} strokeWidth={2} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
