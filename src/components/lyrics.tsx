"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { getSongLyric } from "@/lib/api";
import { parseLrc, type LyricLine } from "@/lib/utils";
import type { Song } from "@/types";

interface LyricsProps {
  song: Song | null;
  currentTime: number;
}

const SPRING = { type: "spring" as const, stiffness: 300, damping: 25, mass: 1 };

export function Lyrics({ song, currentTime }: LyricsProps) {
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<Map<number, HTMLDivElement>>(new Map());
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

  const setLineRef = useCallback((index: number, el: HTMLDivElement | null) => {
    if (el) lineRefs.current.set(index, el);
    else lineRefs.current.delete(index);
  }, []);

  // 手动计算 scrollTop 使当前行居中
  useEffect(() => {
    if (activeIndex < 0 || activeIndex === lastActiveIndex.current) return;
    lastActiveIndex.current = activeIndex;

    const container = containerRef.current;
    const activeLine = lineRefs.current.get(activeIndex);
    if (!container || !activeLine) return;

    const lineTop = activeLine.offsetTop;
    const lineHeight = activeLine.offsetHeight;
    const containerHeight = container.clientHeight;
    const targetTop = lineTop - containerHeight / 2 + lineHeight / 2;

    container.scrollTo({ top: targetTop, behavior: "smooth" });
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
          <motion.div
            key={`${line.time}-${index}`}
            ref={(el) => setLineRef(index, el)}
            animate={{
              scale: isActive ? 1.25 : 1,
              opacity: isActive ? 1 : isPast ? 0.4 : 0.6,
            }}
            transition={SPRING}
            className={`py-3 px-4 text-center text-xl cursor-pointer origin-center ${
              isActive
                ? "text-stone-800 font-bold drop-shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
                : "text-stone-400"
            }`}
          >
            {line.text}
          </motion.div>
        );
      })}
    </div>
  );
}
