"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, Plus, Check, Play, Pause, Loader2 } from "lucide-react";
import { searchSongs } from "@/lib/api";
import { getSongCoverUrl, getSongArtistNames, getSongAlbumName } from "@/types";
import { usePlayer } from "@/hooks/use-player";
import type { Song } from "@/types";

interface SearchSongsProps {
  onAddSong: (song: Song) => void;
  addedSongIds?: number[];
}

export function SearchSongs({ onAddSong, addedSongIds = [] }: SearchSongsProps) {
  const { playSong, currentSong, isPlaying, togglePlay } = usePlayer();
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const doSearch = useCallback(async (kw: string) => {
    // 取消上一次未完成的请求
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setSearched(true);
    try {
      const songs = await searchSongs(kw);
      if (!controller.signal.aborted) {
        setResults(songs);
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        console.error("搜索失败:", error);
        setResults([]);
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  // 输入变化时自动搜索（debounce 400ms，至少 2 个字符）
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    const trimmed = keyword.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setSearched(false);
      setLoading(false);
      return;
    }

    debounceTimer.current = setTimeout(() => {
      doSearch(trimmed);
    }, 400);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [keyword, doSearch]);

  // 手动搜索（回车或点击按钮，立即触发）
  const handleSearch = async () => {
    if (!keyword.trim()) return;
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    await doSearch(keyword.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleAdd = (song: Song) => onAddSong(song);
  const isAdded = (songId: number) => addedSongIds.includes(songId);

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="bg-surface/70 border-border/40 rounded-xl border p-5 backdrop-blur-md">
      <h3 className="mb-4 text-[13px] font-medium text-stone-800">搜索歌曲</h3>

      {/* 搜索框 */}
      <div className="mb-4 flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入歌曲名、歌手名..."
            className="bg-elevated border-border/50 focus:border-accent/40 w-full rounded-lg border px-4 py-2.5 pl-10 text-[13px] text-stone-800 placeholder-stone-400/50 transition-colors focus:outline-none"
          />
          <Search
            size={14}
            className="absolute top-1/2 left-3.5 -translate-y-1/2 text-stone-400/60"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={loading || !keyword.trim()}
          className="bg-accent/10 text-accent hover:bg-accent/20 rounded-lg px-5 py-2.5 text-[13px] font-medium transition-all disabled:cursor-not-allowed disabled:opacity-30"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : "搜索"}
        </button>
      </div>

      {/* 搜索结果 */}
      <div className="scrollbar-hide max-h-96 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={16} className="text-accent animate-spin" />
            <span className="ml-2 text-[13px] text-stone-500">搜索中...</span>
          </div>
        ) : results.length > 0 ? (
          <div className="space-y-0.5">
            {results.map((song) => {
              const added = isAdded(song.id);
              const artistNames = getSongArtistNames(song);
              const albumName = getSongAlbumName(song);
              const coverUrl = getSongCoverUrl(song);

              const isCurrentSong = currentSong?.id === song.id;

              return (
                <div
                  key={song.id}
                  className="group hover:bg-accent/5 flex items-center rounded-lg p-2.5 transition-colors"
                >
                  <img
                    src={coverUrl}
                    alt={albumName}
                    className="ring-border/20 h-9 w-9 rounded ring-1"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/default-cover.svg";
                    }}
                  />

                  <div className="ml-3 flex-1 overflow-hidden">
                    <p className="truncate text-[13px] text-stone-800">{song.name}</p>
                    <p className="truncate text-[11px] text-stone-500">
                      {artistNames}
                      {albumName && ` · ${albumName}`}
                    </p>
                  </div>

                  <span className="w-12 text-right font-mono text-[11px] text-stone-400/60 tabular-nums">
                    {formatDuration(song.duration || 0)}
                  </span>

                  {/* 播放按钮 */}
                  <button
                    onClick={() => {
                      if (isCurrentSong) {
                        togglePlay();
                      } else {
                        playSong(song);
                      }
                    }}
                    className={`ml-2 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full transition-all ${
                      isCurrentSong
                        ? "bg-accent text-white"
                        : "text-stone-400 opacity-0 hover:bg-accent/10 hover:text-accent group-hover:opacity-100"
                    }`}
                    title={isCurrentSong && isPlaying ? "暂停" : "播放"}
                  >
                    {isCurrentSong && isPlaying ? (
                      <Pause size={12} fill="currentColor" />
                    ) : (
                      <Play size={12} fill="currentColor" className="ml-0.5" />
                    )}
                  </button>

                  <button
                    onClick={() => handleAdd(song)}
                    disabled={added}
                    className={`ml-3 rounded-md px-3 py-1 text-[11px] font-medium transition-all ${
                      added
                        ? "cursor-not-allowed bg-stone-200/40 text-stone-400"
                        : "bg-accent/10 text-accent hover:bg-accent/20"
                    }`}
                  >
                    {added ? (
                      <span className="flex items-center">
                        <Check size={12} className="mr-1" />
                        已添加
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <Plus size={12} className="mr-1" />
                        添加
                      </span>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        ) : searched ? (
          <div className="py-8 text-center text-[13px] text-stone-400/60">未找到相关歌曲</div>
        ) : (
          <div className="py-8 text-center text-[13px] text-stone-400/50">输入关键词搜索歌曲</div>
        )}
      </div>
    </div>
  );
}
