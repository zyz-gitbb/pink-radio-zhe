"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { FolderPlus, Music2 } from "lucide-react";
import { getChannels, addSongToChannel } from "@/app/actions";
import { showToast } from "@/components/Toast";
import type { Channel } from "@/types";

interface ChannelPickerPopoverProps {
  songId: number;
  songName: string;
  songCoverUrl?: string;
  songArtistName?: string;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  onClose: () => void;
}

export function ChannelPickerPopover({
  songId,
  songName,
  songCoverUrl,
  songArtistName,
  triggerRef,
  onClose,
}: ChannelPickerPopoverProps) {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [pos, setPos] = useState({ bottom: 0, right: 0 });
  const panelRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    getChannels().then(setChannels);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setPos({
      bottom: window.innerHeight - rect.top + 6,
      right: window.innerWidth - rect.right,
    });
  }, [triggerRef]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose, triggerRef]);

  const handleSelect = async (channelId: string) => {
    const result = await addSongToChannel(channelId, {
      id: songId,
      name: songName,
      artistName: songArtistName,
      coverUrl: songCoverUrl,
    });
    if (result.success) {
      showToast(`已成功收录至「${result.channelName}」`);
    } else if (result.reason === "duplicate") {
      showToast("这首歌已经在频道里啦");
    }
    onClose();
  };

  if (!mounted) return null;

  return createPortal(
    <motion.div
      ref={panelRef}
      className="fixed z-[200] w-56 rounded-xl bg-[#fdfaf8]/95 backdrop-blur-xl shadow-[0_12px_40px_rgba(61,46,46,0.12),0_0_0_1px_rgba(223,218,209,0.5)] overflow-hidden"
      style={{
        bottom: pos.bottom,
        right: pos.right,
        transformOrigin: "bottom right",
      }}
      initial={{ opacity: 0, scale: 0.9, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 8 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
    >
      {/* 标题 */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center gap-2">
          <FolderPlus size={13} className="text-accent" />
          <span className="text-[12px] font-semibold text-stone-700">
            收录至频道
          </span>
        </div>
        <p className="text-[10px] text-stone-400 mt-0.5 truncate">{songName}</p>
      </div>

      <div className="h-px bg-stone-200/60 mx-3" />

      {/* 频道列表 */}
      <div className="py-1.5 max-h-52 overflow-y-auto">
        {channels.length === 0 ? (
          <p className="text-center text-[12px] text-stone-400 py-4">
            暂无频道，请先创建
          </p>
        ) : (
          channels.map((ch) => (
            <button
              key={ch.id}
              onClick={(e) => {
                e.stopPropagation();
                handleSelect(ch.id);
              }}
              className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-accent/8 transition-colors text-left"
            >
              {ch.coverUrl ? (
                <img
                  src={ch.coverUrl}
                  alt={ch.name}
                  className="w-7 h-7 rounded-md object-cover ring-1 ring-border/20 flex-shrink-0"
                />
              ) : (
                <div className="w-7 h-7 rounded-md bg-elevated border border-border/30 flex items-center justify-center flex-shrink-0">
                  <Music2 size={12} className="text-stone-300" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-[12px] text-stone-700 truncate">{ch.name}</p>
                <p className="text-[10px] text-stone-400">
                  {ch.songIds.length} 首歌
                </p>
              </div>
            </button>
          ))
        )}
      </div>
    </motion.div>,
    document.body
  );
}
