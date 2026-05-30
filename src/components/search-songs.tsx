"use client";

import { useState } from "react";
import { Search, Plus, Check, Loader2 } from "lucide-react";
import { searchSongs } from "@/lib/api";
import type { Song } from "@/types";

interface SearchSongsProps {
  onAddSong: (song: Song) => void;
  addedSongIds?: number[];
}

export function SearchSongs({ onAddSong, addedSongIds = [] }: SearchSongsProps) {
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!keyword.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const songs = await searchSongs(keyword.trim());
      setResults(songs);
    } catch (error) {
      console.error("搜索失败:", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
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
    <div className="bg-surface/70 backdrop-blur-md border border-border/40 rounded-xl p-5">
      <h3 className="text-[13px] font-medium text-stone-800 mb-4">搜索歌曲</h3>

      {/* 搜索框 */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1 relative">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入歌曲名、歌手名..."
            className="w-full px-4 py-2.5 pl-10 bg-elevated border border-border/50 rounded-lg text-stone-800 placeholder-stone-400/50 focus:outline-none focus:border-accent/40 transition-colors text-[13px]"
          />
          <Search
            size={14}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400/60"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={loading || !keyword.trim()}
          className="px-5 py-2.5 bg-accent/10 text-accent rounded-lg hover:bg-accent/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed text-[13px] font-medium"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : "搜索"}
        </button>
      </div>

      {/* 搜索结果 */}
      <div className="max-h-96 overflow-y-auto scrollbar-hide">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={16} className="text-accent animate-spin" />
            <span className="ml-2 text-stone-500 text-[13px]">搜索中...</span>
          </div>
        ) : results.length > 0 ? (
          <div className="space-y-0.5">
            {results.map((song) => {
              const added = isAdded(song.id);
              const artistNames = (song.ar || song.artists || []).map((a) => a.name).join("/");
              const albumName = song.al?.name || song.album?.name || "";
              const coverUrl = song.al?.picUrl || song.album?.picUrl || "/default-cover.svg";

              return (
                <div
                  key={song.id}
                  className="flex items-center p-2.5 rounded-lg hover:bg-accent/5 transition-colors"
                >
                  <img
                    src={coverUrl}
                    alt={albumName}
                    className="w-9 h-9 rounded ring-1 ring-border/20"
                    onError={(e) => { (e.target as HTMLImageElement).src = "/default-cover.svg"; }}
                  />

                  <div className="flex-1 ml-3 overflow-hidden">
                    <p className="text-[13px] text-stone-800 truncate">{song.name}</p>
                    <p className="text-[11px] text-stone-500 truncate">
                      {artistNames}
                      {albumName && ` · ${albumName}`}
                    </p>
                  </div>

                  <span className="text-[11px] text-stone-400/60 w-12 text-right tabular-nums font-mono">
                    {formatDuration(song.duration || 0)}
                  </span>

                  <button
                    onClick={() => handleAdd(song)}
                    disabled={added}
                    className={`ml-3 px-3 py-1 rounded-md text-[11px] transition-all font-medium ${
                      added
                        ? "bg-stone-200/40 text-stone-400 cursor-not-allowed"
                        : "bg-accent/10 text-accent hover:bg-accent/20"
                    }`}
                  >
                    {added ? (
                      <span className="flex items-center"><Check size={12} className="mr-1" />已添加</span>
                    ) : (
                      <span className="flex items-center"><Plus size={12} className="mr-1" />添加</span>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        ) : searched ? (
          <div className="text-center py-8 text-stone-400/60 text-[13px]">未找到相关歌曲</div>
        ) : (
          <div className="text-center py-8 text-stone-400/50 text-[13px]">输入关键词搜索歌曲</div>
        )}
      </div>
    </div>
  );
}
