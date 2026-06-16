"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BookOpen, ArrowLeft, Loader2, Play, Search, Wand2 } from "lucide-react";
import { getDiaries, repairDiaryMetadata } from "@/app/actions";
import { showToast } from "@/components/Toast";
import { usePlayer } from "@/hooks/use-player";
import type { Song } from "@/types";

interface DiaryEntry {
  id: string;
  content: string;
  songId?: number;
  songName: string;
  artistName: string;
  coverUrl: string;
  createdAt: number;
}

interface DiaryCard {
  songId: number;
  songName: string;
  artistName: string;
  coverUrl: string;
  entries: { id: string; content: string; timestamp: string }[];
}

export default function DiaryPage() {
  const router = useRouter();
  const [cards, setCards] = useState<DiaryCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [repairing, setRepairing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { setPlaylist } = usePlayer();

  useEffect(() => {
    loadDiaries();
  }, []);

  const loadDiaries = async () => {
    try {
      const allDiaries = await getDiaries();

      // 按 songId 分组
      const groupMap = new Map<
        number,
        {
          songName: string;
          artistName: string;
          coverUrl: string;
          entries: { id: string; content: string; timestamp: string }[];
        }
      >();

      for (const diary of allDiaries) {
        const songId = diary.songId ?? 0;
        if (!groupMap.has(songId)) {
          groupMap.set(songId, {
            songName: diary.songName || `歌曲 #${songId}`,
            artistName: diary.artistName || "未知艺术家",
            coverUrl: diary.coverUrl || "/default-cover.svg",
            entries: [],
          });
        }
        const group = groupMap.get(songId)!;
        const date = new Date(diary.createdAt);
        const pad = (n: number) => String(n).padStart(2, "0");
        const timestamp = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;

        group.entries.push({
          id: diary.id,
          content: diary.content,
          timestamp,
        });
      }

      const result: DiaryCard[] = Array.from(groupMap.entries())
        .map(([songId, data]) => ({
          songId,
          songName: data.songName,
          artistName: data.artistName,
          coverUrl: data.coverUrl,
          entries: data.entries,
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

  // 修复缺失的歌曲元数据
  const handleRepair = async () => {
    setRepairing(true);
    try {
      const result = await repairDiaryMetadata();
      console.log("[handleRepair] 修复结果:", result);
      if (result.repaired > 0) {
        showToast(`已修复 ${result.repaired} 条记录的歌曲信息`);
        // 重新从数据库加载最新数据（server action 直接查询 DB，无缓存）
        await loadDiaries();
      } else if (result.failed > 0) {
        showToast(`有 ${result.failed} 条记录未能匹配到歌曲，API 可能不可用`);
      } else {
        showToast("所有记录的歌曲信息都完好，无需修复");
      }
    } catch (err) {
      console.error("[handleRepair] 修复失败:", err);
      showToast("修复失败，请稍后重试");
    } finally {
      setRepairing(false);
    }
  };

  // 搜索过滤
  const filteredCards = useMemo(() => {
    if (!searchQuery.trim()) return cards;
    const q = searchQuery.toLowerCase();
    return cards.filter((card) => {
      const songName = card.songName.toLowerCase();
      const artists = card.artistName.toLowerCase();
      const diaryText = card.entries.map((e) => e.content.toLowerCase()).join(" ");
      return songName.includes(q) || artists.includes(q) || diaryText.includes(q);
    });
  }, [cards, searchQuery]);

  // 构造播放队列（使用缓存的歌曲信息，构造最简 Song 对象）
  const playableTracks = useMemo(
    () =>
      cards
        .filter((c) => c.songId > 0)
        .map(
          (c) =>
            ({
              id: c.songId,
              name: c.songName,
              ar: [{ id: 0, name: c.artistName }],
              al: { id: 0, name: "", picUrl: c.coverUrl },
              duration: 0,
            }) as Song
        ),
    [cards]
  );

  const handlePlay = (songId: number) => {
    const index = playableTracks.findIndex((s) => s.id === songId);
    if (index >= 0) {
      setPlaylist(playableTracks, index);
    }
  };

  return (
    <div className="min-h-screen px-12 py-10">
      {/* 返回链接 */}
      <Link
        href="/radio"
        className="mb-4 inline-flex items-center text-[12px] text-stone-400 transition-colors hover:text-stone-600"
      >
        <ArrowLeft size={14} className="mr-1" />
        返回
      </Link>

      {/* 标题 + 搜索栏 */}
      <div className="mb-10 flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-stone-800">音乐手账</h1>
            <button
              onClick={handleRepair}
              disabled={repairing}
              title="修复缺失的歌曲封面和名称"
              className={`flex h-6 w-6 items-center justify-center rounded-md text-stone-300 transition-all duration-300 hover:bg-amber-50 hover:text-amber-500 ${repairing ? "animate-pulse text-amber-400" : ""} `}
            >
              <Wand2 size={13} strokeWidth={1.5} />
            </button>
          </div>
          <p className="mt-1 text-[13px] text-stone-400">记录你在音乐里的每一个瞬间</p>
        </div>

        {/* 可折叠搜索胶囊 */}
        <div
          onClick={() => inputRef.current?.focus()}
          className={`flex cursor-pointer items-center overflow-hidden rounded-full transition-all duration-500 ease-out ${
            searchQuery
              ? "w-64 bg-white/50 shadow-sm ring-1 ring-rose-100/50 backdrop-blur-md"
              : "w-10 bg-transparent focus-within:w-64 focus-within:bg-white/50 focus-within:shadow-sm focus-within:ring-1 focus-within:ring-rose-100/50 focus-within:backdrop-blur-md"
          } `}
        >
          <div className="flex min-w-[40px] flex-shrink-0 justify-center">
            <Search size={15} className="text-stone-400" />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索歌曲或手账..."
            className={`w-full border-none bg-transparent pr-4 text-sm text-stone-700 transition-opacity duration-300 outline-none placeholder:text-stone-300 ${searchQuery ? "opacity-100" : "opacity-0 focus:opacity-100"} `}
          />
        </div>
      </div>

      {/* 加载态 */}
      {loading && (
        <div className="flex items-center justify-center py-32">
          <Loader2 size={20} className="animate-spin text-stone-300" />
          <span className="ml-2 text-[13px] text-stone-400">加载手账中...</span>
        </div>
      )}

      {/* 空状态 */}
      {!loading && cards.length === 0 && (
        <div className="flex flex-col items-center justify-center py-32">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-stone-200/40 bg-white/50 backdrop-blur-sm">
            <BookOpen size={24} className="text-stone-300" strokeWidth={1.5} />
          </div>
          <p className="text-[13px] text-stone-400">还没有写下任何手账，去听首歌记录一下吧~</p>
          <Link
            href="/radio"
            className="bg-accent/10 text-accent hover:bg-accent/15 mt-4 rounded-lg px-5 py-2 text-[13px] font-medium transition-all"
          >
            去发现音乐
          </Link>
        </div>
      )}

      {/* 搜索无结果 */}
      {!loading && cards.length > 0 && filteredCards.length === 0 && (
        <div className="flex flex-col items-center justify-center py-32">
          <Search size={24} className="mb-3 text-stone-300" />
          <p className="text-[13px] text-stone-400">没有找到「{searchQuery}」相关的手账</p>
        </div>
      )}

      {/* 手账卡片网格 */}
      {!loading && filteredCards.length > 0 && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredCards.map((card) => (
            <div
              key={card.songId}
              className="overflow-hidden rounded-2xl border border-stone-200/40 bg-white/50 backdrop-blur-sm"
            >
              {/* 卡片头部 — 可点击播放 */}
              <div
                onClick={() => card.songId > 0 && handlePlay(card.songId)}
                className="group -m-2 flex cursor-pointer items-center gap-3.5 rounded-xl p-2 px-5 pt-5 pb-4 transition-colors hover:bg-rose-50/40"
              >
                {/* 封面 + 播放遮罩 */}
                <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl ring-1 ring-stone-200/40">
                  <img
                    src={card.coverUrl}
                    alt={card.songName}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/default-cover.svg";
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 backdrop-blur-[2px] transition-opacity duration-300 group-hover:opacity-100">
                    <Play size={18} fill="white" className="ml-0.5 text-white" />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-stone-800">
                    {card.songName}
                  </p>
                  <p className="mt-0.5 truncate text-[11px] text-stone-400">{card.artistName}</p>
                  <p className="mt-0.5 text-[10px] text-stone-300">{card.entries.length} 条手账</p>
                </div>
              </div>

              {/* 分割线 */}
              <div className="mx-5 h-px bg-stone-200/40" />

              {/* 日记列表 */}
              <div className="scrollbar-hide max-h-[280px] space-y-3 overflow-y-auto px-5 py-3.5">
                {card.entries.map((entry, idx) => (
                  <div key={entry.id || idx}>
                    <p className="mb-1 font-mono text-[10px] text-stone-300">{entry.timestamp}</p>
                    <p className="text-[12.5px] leading-relaxed break-words whitespace-pre-wrap text-stone-600">
                      {entry.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
