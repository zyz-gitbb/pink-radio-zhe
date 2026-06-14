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

export function SongList({ songs, onPlayAll, channelId, onRemoveSong, headerExtra }: SongListProps) {
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
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-base font-medium text-stone-800">歌曲列表</h3>
        <div className="flex items-center gap-3">
          {headerExtra}
          <button
            onClick={handlePlayAll}
            className="flex items-center gap-2 px-5 py-2 bg-accent/10 text-accent rounded-lg hover:bg-accent/20 transition-all text-[13px] font-medium"
          >
            <Play size={14} fill="currentColor" />
            播放全部
          </button>
        </div>
      </div>

      {/* 表头 */}
      <div className="flex items-center px-4 py-2 text-[10px] text-stone-400 uppercase tracking-[0.15em] border-b border-border/30 mb-1 font-mono">
        <span className="w-8 text-center">#</span>
        <span className="w-10 ml-3" />
        <span className="flex-1 ml-3">歌曲名</span>
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

          const coverUrl = song.al?.picUrl || song.album?.picUrl || song.coverUrl || '/default-cover.svg';
          const albumName = song.al?.name || song.album?.name || '未知专辑';
          const artistNames = (song.ar || song.artists || []).map((a) => a.name).join(", ") || '未知艺术家';

          return (
            <motion.div
              key={song.id}
              layout
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0, marginBottom: 0, transition: { duration: 0.25, ease: "easeOut" } }}
              className="overflow-hidden"
            >
              <div
                onClick={() => handlePlaySong(song)}
                className={`group flex items-center px-4 py-2.5 rounded-lg cursor-pointer transition-colors duration-150 ${
                  isCurrentSong
                    ? "bg-accent/[0.06]"
                    : "hover:bg-accent/5"
                }`}
              >
                {/* 序号 */}
                <span className={`w-8 text-center text-[13px] tabular-nums font-mono ${isCurrentSong ? "text-accent" : "text-stone-400/60"}`}>
                  {isCurrentlyPlaying ? (
                    <Pause size={13} className="mx-auto text-accent" fill="currentColor" />
                  ) : (
                    index + 1
                  )}
                </span>

                {/* 封面 */}
                <img
                  src={coverUrl}
                  alt={albumName}
                  className="w-9 h-9 rounded ml-3 ring-1 ring-border/20"
                  onError={(e) => { (e.target as HTMLImageElement).src = '/default-cover.svg'; }}
                />

                {/* 歌曲信息 */}
                <div className="flex-1 ml-3 overflow-hidden">
                  <p className={`text-[13px] truncate ${isCurrentSong ? "text-accent font-medium" : "text-stone-800"}`}>
                    {song.name || '未知歌曲'}
                  </p>
                  <p className="text-[11px] text-stone-500 truncate">
                    {artistNames}
                  </p>
                </div>

                {/* 专辑 */}
                <div className="w-48 text-[12px] text-stone-400 truncate">
                  {albumName}
                </div>

                {/* 时长 */}
                <div className="w-16 text-[12px] text-stone-400/70 text-right tabular-nums font-mono">
                  {formatTime(song.duration || 0)}
                </div>

                {/* 下一首播放 — 悬浮淡入 */}
                <button
                  onClick={(e) => { e.stopPropagation(); playNext(song); }}
                  className="opacity-0 group-hover:opacity-100 flex items-center justify-center w-6 h-6 rounded-md text-stone-400 hover:text-accent hover:bg-accent/10 transition-all duration-200 cursor-pointer"
                  title="下一首播放"
                >
                  <ListPlus size={13} />
                </button>

                {/* 操作按钮 — 悬浮淡入 */}
                <div className="w-8 flex items-center justify-center relative">
                  {isChannelMode ? (
                    /* 移出频道按钮 */
                    <button
                      onClick={(e) => handleRemoveClick(e, song.id)}
                      className="w-6 h-6 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 text-stone-400 hover:text-red-400/80 hover:bg-red-500/8 transition-all duration-300"
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
                        className={`w-6 h-6 rounded-md flex items-center justify-center transition-all duration-200 ${
                          isPickerOpen
                            ? "opacity-100 bg-accent/10 text-accent"
                            : "opacity-0 group-hover:opacity-100 text-stone-400 hover:text-accent hover:bg-accent/10"
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
