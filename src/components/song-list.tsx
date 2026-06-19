"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Song } from "@/types";
import { usePlayer } from "@/hooks/use-player";
import { formatTime } from "@/lib/utils";
import { Play, Pause, FolderPlus, Trash2, ListPlus } from "lucide-react";
import { ChannelPickerPopover } from "@/components/channel-picker-popover";
import { showToast } from "@/components/Toast";

const ROW_HEIGHT = 52; // px, py-2.5 + 内容高度
const VIRTUAL_THRESHOLD = 50; // 超过此数量启用虚拟滚动
const OVERSCAN = 8; // 可视区域外多渲染的行数

interface SongListProps {
  songs: Song[];
  onPlayAll?: () => void;
  channelId?: string;
  onRemoveSong?: (songId: number) => void;
  headerExtra?: React.ReactNode;
}

/** 单行歌曲组件（提取以复用） */
function SongRow({
  song,
  index,
  isCurrentSong,
  isCurrentlyPlaying,
  isChannelMode,
  isPickerOpen,
  coverUrl,
  albumName,
  artistNames,
  onPlay,
  onPlayNext,
  onAddClick,
  onRemoveClick,
  onPickerRef,
  onClosePicker,
}: {
  song: Song;
  index: number;
  isCurrentSong: boolean;
  isCurrentlyPlaying: boolean;
  isChannelMode: boolean;
  isPickerOpen: boolean;
  coverUrl: string;
  albumName: string;
  artistNames: string;
  onPlay: () => void;
  onPlayNext: (e: React.MouseEvent) => void;
  onAddClick: (e: React.MouseEvent) => void;
  onRemoveClick: (e: React.MouseEvent) => void;
  onPickerRef: (el: HTMLButtonElement | null) => void;
  onClosePicker: () => void;
}) {
  return (
    <div
      onClick={onPlay}
      className={`group flex cursor-pointer items-center rounded-lg px-4 py-2.5 transition-colors duration-150 ${
        isCurrentSong ? "bg-accent/[0.06]" : "hover:bg-accent/5"
      }`}
      style={{ height: ROW_HEIGHT }}
    >
      <span
        className={`w-8 text-center font-mono text-[13px] tabular-nums ${isCurrentSong ? "text-accent" : "text-stone-400/60"}`}
      >
        {isCurrentlyPlaying ? (
          <Pause size={13} className="text-accent mx-auto" fill="currentColor" />
        ) : (
          index + 1
        )}
      </span>

      <img
        src={coverUrl}
        alt={albumName}
        className="ring-border/20 ml-3 h-9 w-9 rounded ring-1"
        onError={(e) => {
          (e.target as HTMLImageElement).src = "/default-cover.svg";
        }}
        loading="lazy"
      />

      <div className="ml-3 flex-1 overflow-hidden">
        <p
          className={`truncate text-[13px] ${isCurrentSong ? "text-accent font-medium" : "text-stone-800"}`}
        >
          {song.name || "未知歌曲"}
        </p>
        <p className="truncate text-[11px] text-stone-500">{artistNames}</p>
      </div>

      <div className="w-48 truncate text-[12px] text-stone-400">{albumName}</div>

      <div className="w-16 text-right font-mono text-[12px] text-stone-400/70 tabular-nums">
        {formatTime(song.duration || 0)}
      </div>

      <button
        onClick={onPlayNext}
        className="hover:text-accent hover:bg-accent/10 flex h-6 w-6 cursor-pointer items-center justify-center rounded-md text-stone-400 opacity-0 transition-all duration-200 group-hover:opacity-100"
        title="下一首播放"
      >
        <ListPlus size={13} />
      </button>

      <div className="relative flex w-8 items-center justify-center">
        {isChannelMode ? (
          <button
            onClick={onRemoveClick}
            className="flex h-6 w-6 items-center justify-center rounded-md text-stone-400 opacity-0 transition-all duration-300 group-hover:opacity-100 hover:bg-red-500/8 hover:text-red-400/80"
            title="移出频道"
          >
            <Trash2 size={13} />
          </button>
        ) : (
          <>
            <button
              ref={onPickerRef}
              onClick={onAddClick}
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
                triggerRef={{ current: null }}
                onClose={onClosePicker}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
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
  const isVirtual = songs.length > VIRTUAL_THRESHOLD;

  // 虚拟滚动状态
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(600);

  useEffect(() => {
    if (!isVirtual || !containerRef.current) return;
    const el = containerRef.current;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [isVirtual]);

  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop);
    }
  }, []);

  // 虚拟滚动计算
  const totalHeight = songs.length * ROW_HEIGHT;
  const startIndex = isVirtual ? Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN) : 0;
  const endIndex = isVirtual
    ? Math.min(songs.length, Math.ceil((scrollTop + containerHeight) / ROW_HEIGHT) + OVERSCAN)
    : songs.length;
  const visibleSongs = isVirtual ? songs.slice(startIndex, endIndex) : songs;

  // 预计算歌曲元数据（避免每行重复计算）
  const songMeta = useMemo(() => {
    return songs.map((song) => ({
      coverUrl: song.al?.picUrl || song.album?.picUrl || song.coverUrl || "/default-cover.svg",
      albumName: song.al?.name || song.album?.name || "未知专辑",
      artistNames: (song.ar || song.artists || []).map((a) => a.name).join(", ") || "未知艺术家",
    }));
  }, [songs]);

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

      <div className="border-border/30 mb-1 flex items-center border-b px-4 py-2 font-mono text-[10px] tracking-[0.15em] text-stone-400 uppercase">
        <span className="w-8 text-center">#</span>
        <span className="ml-3 w-10" />
        <span className="ml-3 flex-1">歌曲名</span>
        <span className="w-48">专辑</span>
        <span className="w-16 text-right">时长</span>
        <span className="w-8" />
      </div>

      {isVirtual ? (
        <div
          ref={containerRef}
          className="scrollbar-hide overflow-y-auto"
          style={{ height: "calc(100vh - 320px)", minHeight: 400 }}
          onScroll={handleScroll}
        >
          <div style={{ height: totalHeight, position: "relative" }}>
            <div style={{ position: "absolute", top: startIndex * ROW_HEIGHT, width: "100%" }}>
              {visibleSongs.map((song, i) => {
                const realIndex = startIndex + i;
                const meta = songMeta[realIndex];
                return (
                  <SongRow
                    key={song.id}
                    song={song}
                    index={realIndex}
                    isCurrentSong={currentSong?.id === song.id}
                    isCurrentlyPlaying={currentSong?.id === song.id && isPlaying}
                    isChannelMode={isChannelMode}
                    isPickerOpen={pickerSong?.id === song.id}
                    coverUrl={meta.coverUrl}
                    albumName={meta.albumName}
                    artistNames={meta.artistNames}
                    onPlay={() => handlePlaySong(song)}
                    onPlayNext={(e) => {
                      e.stopPropagation();
                      playNext(song);
                    }}
                    onAddClick={(e) => handleAddClick(e, song)}
                    onRemoveClick={(e) => handleRemoveClick(e, song.id)}
                    onPickerRef={(el) => {
                      if (el) addBtnRefs.current.set(song.id, el);
                      else addBtnRefs.current.delete(song.id);
                    }}
                    onClosePicker={() => setPickerSong(null)}
                  />
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <AnimatePresence initial={false}>
          {songs.map((song, index) => {
            const meta = songMeta[index];
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
                <SongRow
                  song={song}
                  index={index}
                  isCurrentSong={currentSong?.id === song.id}
                  isCurrentlyPlaying={currentSong?.id === song.id && isPlaying}
                  isChannelMode={isChannelMode}
                  isPickerOpen={pickerSong?.id === song.id}
                  coverUrl={meta.coverUrl}
                  albumName={meta.albumName}
                  artistNames={meta.artistNames}
                  onPlay={() => handlePlaySong(song)}
                  onPlayNext={(e) => {
                    e.stopPropagation();
                    playNext(song);
                  }}
                  onAddClick={(e) => handleAddClick(e, song)}
                  onRemoveClick={(e) => handleRemoveClick(e, song.id)}
                  onPickerRef={(el) => {
                    if (el) addBtnRefs.current.set(song.id, el);
                    else addBtnRefs.current.delete(song.id);
                  }}
                  onClosePicker={() => setPickerSong(null)}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      )}
    </div>
  );
}
