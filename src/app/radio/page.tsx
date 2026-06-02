"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  getRecommendations,
  getRecommendationPool,
  getDailyRecommendSongs,
} from "@/lib/api";
import { RecommendationCard } from "@/components/recommendation-card";
import { SongList } from "@/components/song-list";
import { usePlayer } from "@/hooks/use-player";
import {
  RefreshCw,
  Sparkles,
  Radar,
  Music2,
  ArrowLeft,
  Play,
  CalendarDays,
} from "lucide-react";
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

// ========== 骨架屏 ==========

function BentoSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`bg-elevated/60 animate-pulse rounded-3xl ${className}`} />
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="rounded-2xl overflow-hidden bg-surface/70 border border-border/40">
          <div className="aspect-square bg-elevated animate-pulse" />
          <div className="p-4 space-y-2">
            <div className="h-3.5 bg-elevated rounded-md w-3/4 animate-pulse" />
            <div className="h-2.5 bg-elevated rounded w-16 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ========== 主页面 ==========

export default function RadioPage() {
  // ---- 顶部 Bento 封面 + ID ----
  const [dailyCover, setDailyCover] = useState<string>("");
  const [radarCover, setRadarCover] = useState<string>("");
  const [radarId, setRadarId] = useState<number | null>(null);
  const [chineseCover, setChineseCover] = useState<string>("");
  const [chineseId, setChineseId] = useState<number | null>(null);

  // ---- 每日推荐歌曲（点击后展开） ----
  const [dailySongs, setDailySongs] = useState<Song[]>([]);
  const [showDailySongs, setShowDailySongs] = useState(false);
  const [loadingDaily, setLoadingDaily] = useState(false);

  // ---- 底部推荐流（前端洗牌） ----
  type PoolItem = { id: number; name: string; picUrl: string };
  const fullPoolRef = useRef<PoolItem[]>([]);
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

  // ---- 初始化：Bento 封面 + 数据池（带 sessionStorage 缓存） ----
  useEffect(() => {
    // 每日推荐封面
    getDailyRecommendSongs().then((songs) => {
      if (songs.length > 0) {
        const cover = songs[0]?.al?.picUrl || songs[0]?.album?.picUrl || "";
        setDailyCover(cover);
      }
    });

    // Bento 卡片数据
    getRecommendations().then((data) => {
      const items = data.result;
      if (items.length === 0) return;
      const radarItem = items.find((it) => /雷达/.test(it.name));
      const chineseItem = items.find((it) => /华语|日推/.test(it.name));
      const fallback1 = items[0];
      const fallback2 = items.length > 1 ? items[1] : items[0];
      const resolvedRadar = radarItem || fallback1;
      const resolvedChinese = chineseItem || fallback2;
      setRadarId(resolvedRadar.id);
      setRadarCover(resolvedRadar.picUrl);
      setChineseId(resolvedChinese.id);
      setChineseCover(resolvedChinese.picUrl);
    });

    // 探索更多：优先从 sessionStorage 恢复
    try {
      const cachedDisplay = sessionStorage.getItem("explore_display_list");
      const cachedPool = sessionStorage.getItem("explore_pool");
      if (cachedDisplay && cachedPool) {
        const display = JSON.parse(cachedDisplay) as PoolItem[];
        const pool = JSON.parse(cachedPool) as PoolItem[];
        fullPoolRef.current = pool;
        setDisplayList(display);
        setLoadingFlow(false);
        return; // 有缓存，跳过网络请求
      }
    } catch {
      // 缓存解析失败，走正常请求
    }

    // 无缓存：加载大数据池（合并 3 个接口，去重）
    getRecommendationPool(100).then((pool) => {
      fullPoolRef.current = pool;
      setLoadingFlow(false);
      const picked = shuffle(pool).slice(0, PICK_COUNT);
      setDisplayList(picked);
      // 写入缓存
      try {
        sessionStorage.setItem("explore_pool", JSON.stringify(pool));
        sessionStorage.setItem("explore_display_list", JSON.stringify(picked));
      } catch {}
    });
  }, []);

  // bentoIds 就绪后，从池中剔除顶部已占用的（仅在非缓存路径下生效）
  useEffect(() => {
    if (fullPoolRef.current.length === 0) return;
    // 检查是否已经过滤过（避免缓存路径重复剔除）
    const needsFilter = [...bentoIds].some((id) =>
      fullPoolRef.current.some((item) => item.id === id)
    );
    if (!needsFilter) return;
    fullPoolRef.current = fullPoolRef.current.filter((it) => !bentoIds.has(it.id));
    const picked = shuffle(fullPoolRef.current).slice(0, PICK_COUNT);
    setDisplayList(picked);
    try {
      sessionStorage.setItem("explore_pool", JSON.stringify(fullPoolRef.current));
      sessionStorage.setItem("explore_display_list", JSON.stringify(picked));
    } catch {}
  }, [bentoIds]);

  // 换一批：强制重新洗牌（优先从池中洗，池为空则重新请求）
  const refreshPlaylists = useCallback(async () => {
    setIsRefreshing(true);

    let pool = fullPoolRef.current;
    if (pool.length === 0) {
      // 池为空，重新请求
      pool = await getRecommendationPool(100);
      fullPoolRef.current = pool;
    }

    const picked = shuffle(pool).slice(0, PICK_COUNT);
    setDisplayList(picked);

    // 更新缓存
    try {
      sessionStorage.setItem("explore_pool", JSON.stringify(pool));
      sessionStorage.setItem("explore_display_list", JSON.stringify(picked));
    } catch {}

    // 短暂延迟后关闭 spin，给予视觉反馈
    setTimeout(() => setIsRefreshing(false), 500);
  }, []);

  // ---- 每日推荐点击 ----
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
    <div className="px-12 py-10 min-h-screen">
      {/* ====== 页面标题 ====== */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-stone-800 tracking-tight">
            个性化电台
          </h1>
          <p className="text-[13px] text-stone-500 mt-1">
            根据你的口味推荐
          </p>
        </div>
      </div>

      {/* ====== 顶部核心区：Bento Grid ====== */}
      <div className="grid grid-cols-3 gap-4 mb-14">
        {/* 每日推荐 — 宽卡片（占 2 列 + 2 行） */}
        {dailyCover ? (
          <button
            onClick={handleDailyClick}
            className="col-span-2 row-span-2 relative rounded-3xl overflow-hidden group cursor-pointer text-left h-[340px]"
          >
            <img
              src={dailyCover}
              alt="每日推荐"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            <div className="absolute inset-0 backdrop-blur-[0px] group-hover:backdrop-blur-[2px] transition-all duration-500" />
            <div className="absolute bottom-0 left-0 right-0 p-7">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                  <CalendarDays size={12} className="text-white" />
                </div>
                <span className="text-[10px] font-medium text-white/70 tracking-widest uppercase">
                  Daily Mix
                </span>
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                每日推荐
              </h2>
              <p className="text-[13px] text-white/60 mt-1">
                根据你的听歌品味，每天更新 30 首
              </p>
            </div>
            {/* 播放按钮 */}
            <div className="absolute top-6 right-6 w-12 h-12 rounded-full bg-accent flex items-center justify-center shadow-lg shadow-accent/30 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
              <Play size={20} fill="white" className="text-white ml-0.5" />
            </div>
          </button>
        ) : (
          <BentoSkeleton className="col-span-2 row-span-2 h-[340px]" />
        )}

        {/* 私人雷达 — 方形卡片 */}
        {radarCover && radarId ? (
          <Link
            href={`/playlist/${radarId}`}
            className="relative rounded-3xl overflow-hidden group cursor-pointer h-[166px]"
          >
            <img
              src={radarCover}
              alt="私人雷达"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-5">
              <div className="flex items-center gap-2 mb-1.5">
                <Radar size={13} className="text-white/80" />
                <span className="text-[10px] font-medium text-white/60 tracking-widest uppercase">
                  Radar
                </span>
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                私人雷达
              </h3>
            </div>
          </Link>
        ) : (
          <BentoSkeleton className="h-[166px]" />
        )}

        {/* 华语流行日推 — 方形卡片 */}
        {chineseCover && chineseId ? (
          <Link
            href={`/playlist/${chineseId}`}
            className="relative rounded-3xl overflow-hidden group cursor-pointer h-[166px]"
          >
            <img
              src={chineseCover}
              alt="华语流行日推"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-5">
              <div className="flex items-center gap-2 mb-1.5">
                <Music2 size={13} className="text-white/80" />
                <span className="text-[10px] font-medium text-white/60 tracking-widest uppercase">
                  Chinese Pop
                </span>
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                华语流行日推
              </h3>
            </div>
          </Link>
        ) : (
          <BentoSkeleton className="h-[166px]" />
        )}
      </div>

      {/* ====== 每日推荐歌曲展开区 ====== */}
      {showDailySongs && (
        <div className="mb-12 bg-surface/50 backdrop-blur-sm rounded-2xl border border-border/30 p-6">
          <div className="flex items-center gap-3 mb-5">
            <button
              onClick={() => setShowDailySongs(false)}
              className="w-7 h-7 rounded-full bg-stone-200/60 flex items-center justify-center text-stone-500 hover:text-stone-800 hover:bg-stone-200 transition-all"
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
              <RefreshCw size={18} className="text-stone-400 animate-spin" />
              <span className="ml-2 text-[13px] text-stone-400">加载中…</span>
            </div>
          ) : dailySongs.length > 0 ? (
            <SongList songs={dailySongs} onPlayAll={handlePlayAllDaily} />
          ) : (
            <p className="text-center text-[13px] text-stone-400 py-8">
              暂无每日推荐，请先登录
            </p>
          )}
        </div>
      )}

      {/* ====== 区段分隔 ====== */}
      <div className="flex items-center justify-between mb-6 mt-2">
        <div>
          <span className="text-[10px] font-medium text-stone-400 tracking-[0.2em] uppercase">
            Explore
          </span>
          <h2 className="text-lg font-semibold text-stone-800 tracking-tight mt-0.5">
            探索更多
          </h2>
        </div>
        <button
          onClick={refreshPlaylists}
          className="flex items-center gap-2 px-4 py-1.5 text-[13px] text-stone-500 hover:text-stone-800 bg-accent/5 rounded-lg hover:bg-accent/10 transition-all font-medium"
        >
          <RefreshCw size={13} className={isRefreshing ? "animate-spin" : ""} />
          换一批
        </button>
      </div>

      {/* ====== 底部推荐流（洗牌） ====== */}
      {loadingFlow ? (
        <GridSkeleton />
      ) : displayList.length > 0 ? (
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5"
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
                <RecommendationCard
                  id={item.id}
                  name={item.name}
                  picUrl={item.picUrl}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <div className="text-center py-16">
          <div className="w-14 h-14 rounded-2xl bg-elevated border border-border/30 flex items-center justify-center mx-auto mb-4">
            <Sparkles size={22} className="text-stone-300" />
          </div>
          <p className="text-stone-500/60 text-[13px]">暂无推荐</p>
          <p className="text-stone-400/50 text-[12px] mt-1">
            登录后可获取更精准的私人推荐
          </p>
        </div>
      )}
    </div>
  );
}
