"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { getRecommendationPool, getDailyRecommendSongs } from "@/lib/api";
import { RecommendationCard } from "@/components/recommendation-card";
import { SongList } from "@/components/song-list";
import { usePlayer } from "@/hooks/use-player";
import { RefreshCw, Sparkles, Radar, Music2, ArrowLeft, Play, CalendarDays } from "lucide-react";
import type { Song } from "@/types";

// Fisher-Yates 洗牌算法
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type PoolItem = { id: number; name: string; picUrl: string };

interface RadioClientProps {
  initialBento: {
    dailyCover: string;
    radarCover: string;
    radarId: number | null;
    chineseCover: string;
    chineseId: number | null;
  };
  initialPool: PoolItem[];
}

export function RadioClient({ initialBento, initialPool }: RadioClientProps) {
  const { dailyCover, radarCover, radarId, chineseCover, chineseId } = initialBento;

  // ---- 每日推荐歌曲（点击后展开） ----
  const [dailySongs, setDailySongs] = useState<Song[]>([]);
  const [showDailySongs, setShowDailySongs] = useState(false);
  const [loadingDaily, setLoadingDaily] = useState(false);

  // ---- 底部推荐流（前端洗牌） ----
  const fullPoolRef = useRef<PoolItem[]>(initialPool);
  const [displayList, setDisplayList] = useState<PoolItem[]>([]);
  const [loadingFlow, setLoadingFlow] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { setPlaylist } = usePlayer();

  // 顶部已占用的 ID
  const bentoIds = useMemo(() => {
    const ids = new Set<number>();
    if (radarId) ids.add(radarId);
    if (chineseId) ids.add(chineseId);
    return ids;
  }, [radarId, chineseId]);

  // 从池中随机抽取 12 张
  const PICK_COUNT = 12;

  // 初始化推荐流（优先使用 sessionStorage，否则使用服务端传来的 initialPool）
  useEffect(() => {
    try {
      const cachedDisplay = sessionStorage.getItem("explore_display_list");
      const cachedPool = sessionStorage.getItem("explore_pool");
      if (cachedDisplay && cachedPool) {
        const display = JSON.parse(cachedDisplay) as PoolItem[];
        const pool = JSON.parse(cachedPool) as PoolItem[];
        fullPoolRef.current = pool;
        setDisplayList(display);
        setLoadingFlow(false);
        return;
      }
    } catch {}

    // 没有缓存时，使用传入的 initialPool
    let pool = fullPoolRef.current;
    if (pool.length > 0) {
      // 剔除已经被 Bento 占用的 ID
      pool = pool.filter((it) => !bentoIds.has(it.id));
      fullPoolRef.current = pool;

      const picked = shuffle(pool).slice(0, PICK_COUNT);
      setDisplayList(picked);
      setLoadingFlow(false);

      try {
        sessionStorage.setItem("explore_pool", JSON.stringify(pool));
        sessionStorage.setItem("explore_display_list", JSON.stringify(picked));
      } catch {}
    } else {
      setLoadingFlow(false);
    }
  }, [bentoIds]);

  // 换一批：强制重新洗牌（优先从池中洗，池为空则重新请求）
  const refreshPlaylists = useCallback(async () => {
    setIsRefreshing(true);

    let pool = fullPoolRef.current;
    if (pool.length === 0) {
      // 池为空，重新请求客户端接口
      pool = await getRecommendationPool(100);
      fullPoolRef.current = pool;
    }

    const picked = shuffle(pool).slice(0, PICK_COUNT);
    setDisplayList(picked);

    try {
      sessionStorage.setItem("explore_pool", JSON.stringify(pool));
      sessionStorage.setItem("explore_display_list", JSON.stringify(picked));
    } catch {}

    setTimeout(() => setIsRefreshing(false), 500);
  }, []);

  // 每日推荐点击
  const handleDailyClick = async () => {
    if (showDailySongs) {
      setShowDailySongs(false);
      return;
    }
    if (dailySongs.length > 0) {
      setShowDailySongs(true);
      return;
    }
    setLoadingDaily(true);
    const songs = await getDailyRecommendSongs();
    setDailySongs(songs);
    setShowDailySongs(true);
    setLoadingDaily(false);
  };

  const handlePlayAllDaily = () => {
    if (dailySongs.length > 0) setPlaylist(dailySongs, 0);
  };

  return (
    <div className="min-h-screen px-12 py-10">
      {/* ====== 页面标题 ====== */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-stone-800">个性化电台</h1>
          <p className="mt-1 text-[13px] text-stone-500">根据你的口味推荐</p>
        </div>
      </div>

      {/* ====== 顶部核心区：Bento Grid ====== */}
      <div className="mb-14 grid grid-cols-3 gap-4">
        {/* 每日推荐 */}
        {dailyCover ? (
          <button
            onClick={handleDailyClick}
            className="group relative col-span-2 row-span-2 h-[340px] cursor-pointer overflow-hidden rounded-3xl text-left"
          >
            <img
              src={dailyCover}
              alt="每日推荐"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            <div className="absolute inset-0 backdrop-blur-[0px] transition-all duration-500 group-hover:backdrop-blur-[2px]" />
            <div className="absolute right-0 bottom-0 left-0 p-7">
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 backdrop-blur-md">
                  <CalendarDays size={12} className="text-white" />
                </div>
                <span className="text-[10px] font-medium tracking-widest text-white/70 uppercase">
                  Daily Mix
                </span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-white">每日推荐</h2>
              <p className="mt-1 text-[13px] text-white/60">根据你的听歌品味，每天更新 30 首</p>
            </div>
            {/* 播放按钮 */}
            <div className="bg-accent shadow-accent/30 absolute top-6 right-6 flex h-12 w-12 translate-y-2 items-center justify-center rounded-full opacity-0 shadow-lg transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
              <Play size={20} fill="white" className="ml-0.5 text-white" />
            </div>
          </button>
        ) : (
          <div className="bg-elevated/60 col-span-2 row-span-2 h-[340px] animate-pulse rounded-3xl" />
        )}

        {/* 私人雷达 */}
        {radarCover && radarId ? (
          <Link
            href={`/playlist/${radarId}`}
            className="group relative h-[166px] cursor-pointer overflow-hidden rounded-3xl"
          >
            <img
              src={radarCover}
              alt="私人雷达"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            <div className="absolute right-0 bottom-0 left-0 p-5">
              <div className="mb-1.5 flex items-center gap-2">
                <Radar size={13} className="text-white/80" />
                <span className="text-[10px] font-medium tracking-widest text-white/60 uppercase">
                  Radar
                </span>
              </div>
              <h3 className="text-lg font-bold tracking-tight text-white">私人雷达</h3>
            </div>
          </Link>
        ) : (
          <div className="bg-elevated/60 h-[166px] animate-pulse rounded-3xl" />
        )}

        {/* 华语流行日推 */}
        {chineseCover && chineseId ? (
          <Link
            href={`/playlist/${chineseId}`}
            className="group relative h-[166px] cursor-pointer overflow-hidden rounded-3xl"
          >
            <img
              src={chineseCover}
              alt="华语流行日推"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            <div className="absolute right-0 bottom-0 left-0 p-5">
              <div className="mb-1.5 flex items-center gap-2">
                <Music2 size={13} className="text-white/80" />
                <span className="text-[10px] font-medium tracking-widest text-white/60 uppercase">
                  Chinese Pop
                </span>
              </div>
              <h3 className="text-lg font-bold tracking-tight text-white">华语流行日推</h3>
            </div>
          </Link>
        ) : (
          <div className="bg-elevated/60 h-[166px] animate-pulse rounded-3xl" />
        )}
      </div>

      {/* ====== 每日推荐歌曲展开区 ====== */}
      {showDailySongs && (
        <div className="bg-surface/50 border-border/30 mb-12 rounded-2xl border p-6 backdrop-blur-sm">
          <div className="mb-5 flex items-center gap-3">
            <button
              onClick={() => setShowDailySongs(false)}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-stone-200/60 text-stone-500 transition-all hover:bg-stone-200 hover:text-stone-800"
            >
              <ArrowLeft size={14} />
            </button>
            <div>
              <h3 className="text-base font-semibold text-stone-800">每日推荐歌曲</h3>
              <p className="text-[11px] text-stone-400">{dailySongs.length} 首歌曲</p>
            </div>
          </div>
          {loadingDaily ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw size={18} className="animate-spin text-stone-400" />
              <span className="ml-2 text-[13px] text-stone-400">加载中…</span>
            </div>
          ) : dailySongs.length > 0 ? (
            <SongList songs={dailySongs} onPlayAll={handlePlayAllDaily} />
          ) : (
            <p className="py-8 text-center text-[13px] text-stone-400">暂无每日推荐，请先登录</p>
          )}
        </div>
      )}

      {/* ====== 区段分隔 ====== */}
      <div className="mt-2 mb-6 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-medium tracking-[0.2em] text-stone-400 uppercase">
            Explore
          </span>
          <h2 className="mt-0.5 text-lg font-semibold tracking-tight text-stone-800">探索更多</h2>
        </div>
        <button
          onClick={refreshPlaylists}
          className="bg-accent/5 hover:bg-accent/10 flex items-center gap-2 rounded-lg px-4 py-1.5 text-[13px] font-medium text-stone-500 transition-all hover:text-stone-800"
        >
          <RefreshCw size={13} className={isRefreshing ? "animate-spin" : ""} />
          换一批
        </button>
      </div>

      {/* ====== 底部推荐流（洗牌） ====== */}
      {loadingFlow ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="bg-surface/70 border-border/40 overflow-hidden rounded-2xl border"
            >
              <div className="bg-elevated aspect-square animate-pulse" />
              <div className="space-y-2 p-4">
                <div className="bg-elevated h-3.5 w-3/4 animate-pulse rounded-md" />
                <div className="bg-elevated h-2.5 w-16 animate-pulse rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : displayList.length > 0 ? (
        <motion.div
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
          layout
        >
          <AnimatePresence mode="popLayout" initial={false}>
            {displayList.map((item, index) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                transition={{
                  type: "spring",
                  damping: 25,
                  stiffness: 250,
                  delay: index * 0.03,
                }}
              >
                <RecommendationCard id={item.id} name={item.name} picUrl={item.picUrl} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <div className="py-16 text-center">
          <div className="bg-elevated border-border/30 mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border">
            <Sparkles size={22} className="text-stone-300" />
          </div>
          <p className="text-[13px] text-stone-500/60">暂无推荐</p>
          <p className="mt-1 text-[12px] text-stone-400/50">登录后可获取更精准的私人推荐</p>
        </div>
      )}
    </div>
  );
}
