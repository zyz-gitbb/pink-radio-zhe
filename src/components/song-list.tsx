"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Song } from "@/types";
import { usePlayer } from "@/hooks/use-player";
import { formatTime } from "@/lib/utils";
import { Play, Pause, FolderPlus, Trash2, ListPlus } from "lucide-react";
import { ChannelPickerPopover } from "@/components/channel-picker-popover";
import { showToast } from "@/components/Toast";

interface SongListProps {
  songs: Song[];
  onPlayAll?: () => void;
  /** 传入 channelId 则为自定义频道模式：显示"移出"按钮而非"添加"按钮 */
  channelId?: string;
  /** 移出歌曲后的回调（用于父组件更新本地状态） */
  onRemoveSong?: (songId: number) => void;
  /** 标题栏右侧额外操作按钮（如"添加歌曲"） */
  headerExtra?: React.ReactNode;
}

export function SongList({
  songs,
  onPlayAll,
  channelId,
  onRemoveSong,
  headerExtra,
}: SongListProps) {
  const { currentSong, isPlaying, setPlaylist, playNext } = usePlayer();
  const [pickerSong, setPickerSong] = useState<Song | null>(null);
  const addBtnRefs = useRef<Map<number, HTMLButtonElement>>(new Map());
  const isChannelMode = !!channelId;

  const handlePlaySong = (song: Song) => {
    const index = songs.findIndex((s) => s.id === song.id);
    setPlaylist(songs, index >= 0 ? index : 0);
  };

  const handlePlayAll = () => {
    if (songs.length > 0) {
      setPlaylist(songs, 0);
      if (onPlayAll) onPlayAll();
    }
  };

  const handleAddClick = (e: React.MouseEvent, song: Song) => {
    e.stopPropagation();
    setPickerSong(pickerSong?.id === song.id ? null : song);
  };

  const handleRemoveClick = (e: React.MouseEvent, songId: number) => {
    e.stopPropagation();
    if (!channelId) return;
    showToast("已从频道中移出");
    onRemoveSong?.(songId);
  };

  return (
    <div>
      {/* 播放全部按钮 */}
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-base font-medium text-stone-800">歌曲列表</h3>
        <div className="flex items-center gap-3">
          {headerExtra}
          <button
            onClick={handlePlayAll}
            className="bg-accent/10 text-accent hover:bg-accent/20 flex items-center gap-2 rounded-lg px-5 py-2 text-[13px] font-medium transition-all"
          >
            <Play size={14} fill="currentColor" />
            播放全部
          </button>
        </div>
      </div>

      {/* 表头 */}
      <div className="border-border/30 mb-1 flex items-center border-b px-4 py-2 font-mono text-[10px] tracking-[0.15em] text-stone-400 uppercase">
        <span className="w-8 text-center">#</span>
        <span className="ml-3 w-10" />
        <span className="ml-3 flex-1">歌曲名</span>
        <span className="w-48">专辑</span>
        <span className="w-16 text-right">时长</span>
        <span className="w-8" />
      </div>

      {/* 歌曲列表 */}
      <AnimatePresence initial={false}>
        {songs.map((song, index) => {
          const isCurrentSong = currentSong?.id === song.id;
          const isCurrentlyPlaying = isCurrentSong && isPlaying;
          const isPickerOpen = pickerSong?.id === song.id;

          const coverUrl =
            song.al?.picUrl || song.album?.picUrl || song.coverUrl || "/default-cover.svg";
          const albumName = song.al?.name || song.album?.name || "未知专辑";
          const artistNames =
            (song.ar || song.artists || []).map((a) => a.name).join(", ") || "未知艺术家";

          return (
            <motion.div
              key={song.id}
              layout
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{
                opacity: 0,
                height: 0,
                marginBottom: 0,
                transition: { duration: 0.25, ease: "easeOut" },
              }}
              className="overflow-hidden"
            >
              <div
                onClick={() => handlePlaySong(song)}
                className={`group flex cursor-pointer items-center rounded-lg px-4 py-2.5 transition-colors duration-150 ${
                  isCurrentSong ? "bg-accent/[0.06]" : "hover:bg-accent/5"
                }`}
              >
                {/* 序号 */}
                <span
                  className={`w-8 text-center font-mono text-[13px] tabular-nums ${isCurrentSong ? "text-accent" : "text-stone-400/60"}`}
                >
                  {isCurrentlyPlaying ? (
                    <Pause size={13} className="text-accent mx-auto" fill="currentColor" />
                  ) : (
                    index + 1
                  )}
                </span>

                {/* 封面 */}
                <img
                  src={coverUrl}
                  alt={albumName}
                  className="ring-border/20 ml-3 h-9 w-9 rounded ring-1"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/default-cover.svg";
                  }}
                />

                {/* 歌曲信息 */}
                <div className="ml-3 flex-1 overflow-hidden">
                  <p
                    className={`truncate text-[13px] ${isCurrentSong ? "text-accent font-medium" : "text-stone-800"}`}
                  >
                    {song.name || "未知歌曲"}
                  </p>
                  <p className="truncate text-[11px] text-stone-500">{artistNames}</p>
                </div>

                {/* 专辑 */}
                <div className="w-48 truncate text-[12px] text-stone-400">{albumName}</div>

                {/* 时长 */}
                <div className="w-16 text-right font-mono text-[12px] text-stone-400/70 tabular-nums">
                  {formatTime(song.duration || 0)}
                </div>

                {/* 下一首播放 — 悬浮淡入 */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    playNext(song);
                  }}
                  className="hover:text-accent hover:bg-accent/10 flex h-6 w-6 cursor-pointer items-center justify-center rounded-md text-stone-400 opacity-0 transition-all duration-200 group-hover:opacity-100"
                  title="下一首播放"
                >
                  <ListPlus size={13} />
                </button>

                {/* 操作按钮 — 悬浮淡入 */}
                <div className="relative flex w-8 items-center justify-center">
                  {isChannelMode ? (
                    /* 移出频道按钮 */
                    <button
                      onClick={(e) => handleRemoveClick(e, song.id)}
                      className="flex h-6 w-6 items-center justify-center rounded-md text-stone-400 opacity-0 transition-all duration-300 group-hover:opacity-100 hover:bg-red-500/8 hover:text-red-400/80"
                      title="移出频道"
                    >
                      <Trash2 size={13} />
                    </button>
                  ) : (
                    /* 收录到频道按钮 */
                    <>
                      <button
                        ref={(el) => {
                          if (el) addBtnRefs.current.set(song.id, el);
                          else addBtnRefs.current.delete(song.id);
                        }}
                        onClick={(e) => handleAddClick(e, song)}
                        className={`flex h-6 w-6 items-center justify-center rounded-md transition-all duration-200 ${
                          isPickerOpen
                            ? "bg-accent/10 text-accent opacity-100"
                            : "hover:text-accent hover:bg-accent/10 text-stone-400 opacity-0 group-hover:opacity-100"
                        }`}
                        title="收录到频道"
                      >
                        <FolderPlus size={13} />
                      </button>

                      {isPickerOpen && (
                        <ChannelPickerPopover
                          songId={song.id}
                          songName={song.name}
                          songCoverUrl={coverUrl}
                          songArtistName={artistNames}
                          triggerRef={{ current: addBtnRefs.current.get(song.id) ?? null }}
                          onClose={() => setPickerSong(null)}
                        />
                      )}
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
