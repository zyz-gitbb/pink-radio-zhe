"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { BookOpen, ArrowLeft, Loader2, Play, Search } from "lucide-react";
import { getSongDetailBatch } from "@/lib/api";
import { usePlayer } from "@/hooks/use-player";
import type { Song } from "@/types";

interface DiaryEntry {
  id: string;
  content: string;
  timestamp: string;
}

interface DiaryCard {
  songId: number;
  song: Song | null;
  entries: DiaryEntry[];
}

export default function DiaryPage() {
  const [cards, setCards] = useState<DiaryCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { setPlaylist } = usePlayer();

  useEffect(() => {
    setMounted(true);
    loadDiaries();
  }, []);

  const loadDiaries = async () => {
    try {
      const diaryMap = new Map<number, DiaryEntry[]>();
      const songIds: number[] = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key || !key.startsWith("music_diary_")) continue;

        const songId = parseInt(key.replace("music_diary_", ""), 10);
        if (isNaN(songId)) continue;

        try {
          const raw = localStorage.getItem(key);
          if (!raw) continue;
          const parsed = JSON.parse(raw);

          let entries: DiaryEntry[];
          if (Array.isArray(parsed)) {
            entries = parsed;
          } else if (parsed && typeof parsed === "object" && parsed.content) {
            entries = [{ id: "legacy", content: parsed.content, timestamp: parsed.timestamp || "" }];
          } else {
            continue;
          }

          if (entries.length > 0) {
            diaryMap.set(songId, entries);
            songIds.push(songId);
          }
        } catch {
          // skip
        }
      }

      if (songIds.length === 0) {
        setCards([]);
        setLoading(false);
        return;
      }

      const songs = await getSongDetailBatch(songIds);
      const songMap = new Map(songs.map((s) => [s.id, s]));

      const result: DiaryCard[] = songIds
        .map((id) => ({
          songId: id,
          song: songMap.get(id) || null,
          entries: diaryMap.get(id) || [],
        }))
        .sort((a, b) => {
          const aTime = a.entries[0]?.timestamp || "";
          const bTime = b.entries[0]?.timestamp || "";
          return bTime.localeCompare(aTime);
        });

      setCards(result);
    } catch (error) {
      console.error("加载手账数据失败:", error);
    } finally {
      setLoading(false);
    }
  };

  // 提取所有有效歌曲组成播放队列
  const playableTracks = useMemo(
    () => cards.filter((c) => c.song !== null).map((c) => c.song as Song),
    [cards]
  );

  // 搜索过滤
  const filteredCards = useMemo(() => {
    if (!searchQuery.trim()) return cards;
    const q = searchQuery.toLowerCase();
    return cards.filter((card) => {
      const songName = (card.song?.name || "").toLowerCase();
      const artists = (card.song?.ar || card.song?.artists || [])
        .map((a) => a.name.toLowerCase())
        .join(" ");
      const diaryText = card.entries
        .map((e) => e.content.toLowerCase())
        .join(" ");
      return songName.includes(q) || artists.includes(q) || diaryText.includes(q);
    });
  }, [cards, searchQuery]);

  const handlePlay = (song: Song) => {
    const index = playableTracks.findIndex((s) => s.id === song.id);
    setPlaylist(playableTracks, index >= 0 ? index : 0);
  };

  if (!mounted) return null;

  return (
    <div className="px-12 py-10 min-h-screen">
      {/* 返回链接 */}
      <Link
        href="/radio"
        className="inline-flex items-center text-[12px] text-stone-400 hover:text-stone-600 transition-colors mb-4"
      >
        <ArrowLeft size={14} className="mr-1" />
        返回
      </Link>

      {/* 标题 + 搜索栏 */}
      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-2xl font-semibold text-stone-800 tracking-tight">
            音乐手账
          </h1>
          <p className="text-[13px] text-stone-400 mt-1">
            记录你在音乐里的每一个瞬间
          </p>
        </div>

        {/* 可折叠搜索胶囊 */}
        <div
          onClick={() => inputRef.current?.focus()}
          className={`
            flex items-center rounded-full transition-all duration-500 ease-out overflow-hidden cursor-pointer
            ${searchQuery
              ? "w-64 bg-white/50 backdrop-blur-md shadow-sm ring-1 ring-rose-100/50"
              : "w-10 bg-transparent focus-within:w-64 focus-within:bg-white/50 focus-within:backdrop-blur-md focus-within:shadow-sm focus-within:ring-1 focus-within:ring-rose-100/50"
            }
          `}
        >
          <div className="min-w-[40px] flex justify-center flex-shrink-0">
            <Search size={15} className="text-stone-400" />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索歌曲或手账..."
            className={`
              w-full bg-transparent outline-none border-none text-sm text-stone-700 placeholder:text-stone-300 pr-4
              transition-opacity duration-300
              ${searchQuery ? "opacity-100" : "opacity-0 focus:opacity-100"}
            `}
          />
        </div>
      </div>

      {/* 加载态 */}
      {loading && (
        <div className="flex items-center justify-center py-32">
          <Loader2 size={20} className="text-stone-300 animate-spin" />
          <span className="ml-2 text-[13px] text-stone-400">加载手账中...</span>
        </div>
      )}

      {/* 空状态 */}
      {!loading && cards.length === 0 && (
        <div className="flex flex-col items-center justify-center py-32">
          <div className="w-16 h-16 rounded-2xl bg-white/50 backdrop-blur-sm border border-stone-200/40 flex items-center justify-center mb-5">
            <BookOpen size={24} className="text-stone-300" strokeWidth={1.5} />
          </div>
          <p className="text-stone-400 text-[13px]">
            还没有写下任何手账，去听首歌记录一下吧~
          </p>
          <Link
            href="/radio"
            className="mt-4 px-5 py-2 bg-accent/10 text-accent rounded-lg hover:bg-accent/15 transition-all text-[13px] font-medium"
          >
            去发现音乐
          </Link>
        </div>
      )}

      {/* 搜索无结果 */}
      {!loading && cards.length > 0 && filteredCards.length === 0 && (
        <div className="flex flex-col items-center justify-center py-32">
          <Search size={24} className="text-stone-300 mb-3" />
          <p className="text-stone-400 text-[13px]">
            没有找到「{searchQuery}」相关的手账
          </p>
        </div>
      )}

      {/* 手账卡片网格 */}
      {!loading && filteredCards.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCards.map((card) => {
            const coverUrl =
              card.song?.al?.picUrl ||
              card.song?.album?.picUrl ||
              card.song?.coverUrl ||
              "/default-cover.svg";
            const songName = card.song?.name || `歌曲 #${card.songId}`;
            const artistNames =
              (card.song?.ar || card.song?.artists || [])
                .map((a) => a.name)
                .join(", ") || "未知艺术家";

            return (
              <div
                key={card.songId}
                className="bg-white/50 backdrop-blur-sm rounded-2xl border border-stone-200/40 overflow-hidden"
              >
                {/* 卡片头部 — 可点击播放 */}
                <div
                  onClick={() => card.song && handlePlay(card.song)}
                  className="group flex items-center gap-3.5 px-5 pt-5 pb-4 cursor-pointer hover:bg-rose-50/40 transition-colors p-2 -m-2 rounded-xl"
                >
                  {/* 封面 + 播放遮罩 */}
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 ring-1 ring-stone-200/40">
                    <img
                      src={coverUrl}
                      alt={songName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/default-cover.svg";
                      }}
                    />
                    <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <Play size={18} fill="white" className="text-white ml-0.5" />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-stone-800 truncate">
                      {songName}
                    </p>
                    <p className="text-[11px] text-stone-400 truncate mt-0.5">
                      {artistNames}
                    </p>
                    <p className="text-[10px] text-stone-300 mt-0.5">
                      {card.entries.length} 条手账
                    </p>
                  </div>
                </div>

                {/* 分割线 */}
                <div className="h-px bg-stone-200/40 mx-5" />

                {/* 日记列表 */}
                <div className="px-5 py-3.5 space-y-3 max-h-[280px] overflow-y-auto scrollbar-hide">
                  {card.entries.map((entry, idx) => (
                    <div key={entry.id || idx}>
                      <p className="text-[10px] text-stone-300 font-mono mb-1">
                        {entry.timestamp}
                      </p>
                      <p className="text-[12.5px] text-stone-600 leading-relaxed whitespace-pre-wrap break-words">
                        {entry.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
