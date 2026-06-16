"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { getSongLyric } from "@/lib/api";
import { parseLrc, type LyricLine } from "@/lib/utils";
import type { Song } from "@/types";

interface LyricsProps {
  song: Song | null;
  currentTime: number;
  onSeek?: (time: number) => void;
}

export function Lyrics({ song, currentTime, onSeek }: LyricsProps) {
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [loading, setLoading] = useState(false);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const lastActiveIndex = useRef(-1);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isUserScrollingRef = useRef(false);

  useEffect(() => {
    if (!song) {
      setLyrics([]);
      return;
    }
    let cancelled = false;
    const fetchLyrics = async () => {
      setLoading(true);
      const lrcText = await getSongLyric(song.id);
      if (!cancelled) {
        setLyrics(parseLrc(lrcText || ""));
        setLoading(false);
      }
    };
    fetchLyrics();
    return () => {
      cancelled = true;
    };
  }, [song?.id]);

  const activeIndex = useMemo(() => {
    if (lyrics.length === 0) return -1;
    let idx = -1;
    for (let i = 0; i < lyrics.length; i++) {
      if (currentTime >= lyrics[i].time) idx = i;
      else break;
    }
    return idx;
  }, [lyrics, currentTime]);

  const setLineRef = useCallback((index: number, el: HTMLDivElement | null) => {
    if (el) lineRefs.current.set(index, el);
    else lineRefs.current.delete(index);
  }, []);

  // 防抖：每次滚动重置计时器，完全静止 3.5 秒后恢复自动对焦
  const handleUserScroll = useCallback(() => {
    // 首次进入滚动模式时同步更新 ref 和 state
    if (!isUserScrollingRef.current) {
      isUserScrollingRef.current = true;
      setIsUserScrolling(true);
    }
    // 每次滚动事件都重置计时器（核心防抖）
    if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    scrollTimerRef.current = setTimeout(() => {
      isUserScrollingRef.current = false;
      setIsUserScrolling(false);
      // 丝滑回弹到当前播放行
      const container = containerRef.current;
      if (!container || lastActiveIndex.current < 0) return;
      const activeLine = lineRefs.current.get(lastActiveIndex.current);
      if (!activeLine) return;
      const targetTop =
        activeLine.offsetTop - container.clientHeight / 2 + activeLine.offsetHeight / 2;
      container.scrollTo({ top: targetTop, behavior: "smooth" });
    }, 3500);
  }, []);

  // 清理滚动计时器
  useEffect(() => {
    return () => {
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    };
  }, []);

  // 手动计算 scrollTop 使当前行居中（用户手动滚动时跳过，避免互相争夺滚动位置）
  useEffect(() => {
    if (activeIndex < 0 || activeIndex === lastActiveIndex.current) return;
    lastActiveIndex.current = activeIndex;
    if (isUserScrollingRef.current) return;

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
    return (
      <div className="flex h-full items-center justify-center text-[13px] text-stone-400">
        暂无歌曲播放
      </div>
    );
  }
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-[13px] text-stone-400">
        加载歌词中...
      </div>
    );
  }
  if (lyrics.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-[13px] text-stone-400/60">
        暂无歌词
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="scrollbar-hide h-full overflow-y-auto py-16"
      style={{ maskImage: "linear-gradient(transparent, black 12%, black 88%, transparent)" }}
      onWheel={handleUserScroll}
      onTouchMove={handleUserScroll}
    >
      {lyrics.map((line, index) => {
        const distance = Math.abs(index - activeIndex);
        const isActive = distance === 0;

        const currentBlur = isUserScrolling ? 0 : Math.min(4, distance * 1);
        const currentOpacity = isUserScrolling
          ? Math.max(0.4, 1 - distance * 0.05)
          : Math.max(0.15, 1 - distance * 0.2);

        return (
          <motion.div
            key={`${line.time}-${index}`}
            ref={(el) => setLineRef(index, el)}
            animate={{
              scale: isActive && !isUserScrolling ? 1.05 : 1,
              opacity: currentOpacity,
              filter: `blur(${currentBlur}px)`,
            }}
            transition={{ duration: 0.3 }}
            onClick={() => onSeek?.(line.time)}
            className={`origin-center cursor-pointer px-4 py-3 text-center text-xl ${
              isActive
                ? "font-bold text-stone-800 drop-shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
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
