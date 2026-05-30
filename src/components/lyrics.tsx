"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { getSongLyric } from "@/lib/api";
import { parseLrc, type LyricLine } from "@/lib/utils";
import type { Song } from "@/types";

interface LyricsProps {
  song: Song | null;
  currentTime: number;
}

export function Lyrics({ song, currentTime }: LyricsProps) {
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastActiveIndex = useRef(-1);

  useEffect(() => {
    if (!song) { setLyrics([]); return; }
    let cancelled = false;
    const fetchLyrics = async () => {
      setLoading(true);
      const lrcText = await getSongLyric(song.id);
      if (!cancelled) { setLyrics(parseLrc(lrcText || "")); setLoading(false); }
    };
    fetchLyrics();
    return () => { cancelled = true; };
  }, [song?.id]);

  const activeIndex = useMemo(() => {
    if (lyrics.length === 0) return -1;
    let idx = -1;
    for (let i = 0; i < lyrics.length; i++) {
      if (currentTime >= lyrics[i].time) idx = i; else break;
    }
    return idx;
  }, [lyrics, currentTime]);

  useEffect(() => {
    if (activeIndex < 0 || activeIndex === lastActiveIndex.current) return;
    lastActiveIndex.current = activeIndex;
    const container = containerRef.current;
    if (!container) return;
    const activeLine = container.querySelector(`[data-lyric-index="${activeIndex}"]`);
    if (activeLine) activeLine.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [activeIndex]);

  if (!song) {
    return <div className="flex items-center justify-center h-full text-stone-400 text-[13px]">暂无歌曲播放</div>;
  }
  if (loading) {
    return <div className="flex items-center justify-center h-full text-stone-400 text-[13px]">加载歌词中...</div>;
  }
  if (lyrics.length === 0) {
    return <div className="flex items-center justify-center h-full text-stone-400/60 text-[13px]">暂无歌词</div>;
  }

  return (
    <div
      ref={containerRef}
      className="h-full overflow-y-auto scrollbar-hide py-16"
      style={{ maskImage: "linear-gradient(transparent, black 12%, black 88%, transparent)" }}
    >
      {lyrics.map((line, index) => {
        const isActive = index === activeIndex;
        const isPast = index < activeIndex;
        return (
          <div
            key={`${line.time}-${index}`}
            data-lyric-index={index}
            className={`py-3 px-4 text-center transition-all duration-500 ease-in-out cursor-pointer ${
              isActive
                ? "text-stone-800 text-3xl font-bold drop-shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
                : isPast
                  ? "text-stone-400/40 text-base opacity-50"
                  : "text-stone-400/60 text-xl opacity-70"
            }`}
          >
            {line.text}
          </div>
        );
      })}
    </div>
  );
}
