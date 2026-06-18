"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import { usePlayer } from "@/hooks/use-player";
import { formatTime } from "@/lib/utils";
import { getSongUrl } from "@/lib/api";
import { showToast } from "@/components/Toast";
import { Lyrics } from "@/components/lyrics";
import { CommentDrawer } from "@/components/comment-drawer";
import { AmbientBackground } from "@/components/ambient-background";
import { MusicDiary } from "@/components/music-diary";
import { ChannelPickerPopover } from "@/components/channel-picker-popover";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Repeat,
  Shuffle,
  Mic2,
  MessageSquare,
  X,
  FolderPlus,
  ListMusic,
  AudioLines,
  ListPlus,
} from "lucide-react";

// ========== 3D 悬浮视差封面 ==========

function CoverCard3D({ src, alt }: { src: string; alt: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  const springConfig = { stiffness: 300, damping: 30 };
  const rotateX = useSpring(useTransform(mouseY, [0, 1], [10, -10]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [0, 1], [-10, 10]), springConfig);
  const glareX = useSpring(useTransform(mouseX, [0, 1], [-50, 50]), springConfig);
  const glareY = useSpring(useTransform(mouseY, [0, 1], [-50, 50]), springConfig);

  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width);
    mouseY.set((e.clientY - rect.top) / rect.height);
  };

  const handleMouseLeave = () => {
    mouseX.set(0.5);
    mouseY.set(0.5);
    setIsHovered(false);
  };

  return (
    <div style={{ perspective: 1200 }}>
      <motion.div
        ref={ref}
        className="relative h-64 w-64 cursor-pointer overflow-hidden rounded-2xl"
        style={{
          transformStyle: "preserve-3d",
          rotateX,
          rotateY,
        }}
        whileHover={{
          scale: 1.02,
          y: -5,
          boxShadow: "0px 25px 50px rgba(0,0,0,0.2)",
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
      >
        <img
          src={src}
          alt={alt}
          className="h-64 w-64 rounded-2xl object-cover ring-1 ring-black/5"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/default-cover.svg";
          }}
        />
        {/* 动态光斑层 */}
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-2xl"
          style={{
            background:
              "radial-gradient(ellipse_at_center, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 70%)",
            x: glareX,
            y: glareY,
            opacity: isHovered ? 1 : 0,
          }}
          transition={{ opacity: { duration: 0.3 } }}
        />
      </motion.div>
    </div>
  );
}

export function Player() {
  const {
    currentSong,
    isPlaying,
    volume,
    progress,
    duration,
    playMode,
    playlist,
    currentIndex,
    audioRef,
    togglePlay,
    next,
    prev,
    setVolume,
    setProgress,
    setDuration,
    setPlayMode,
    playSong,
    removeSong,
    playNext,
    seek,
  } = usePlayer();

  const [showLyrics, setShowLyrics] = useState(false);
  const [isCommentOpen, setIsCommentOpen] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const addBtnRef = useRef<HTMLButtonElement>(null);
  const queueRef = useRef<HTMLDivElement>(null);
  const queueBtnRef = useRef<HTMLButtonElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const previousVolume = useRef(volume);
  const playPromiseRef = useRef<Promise<void> | null>(null);
  const currentSongIdRef = useRef<number | null>(null);

  const safePlay = async () => {
    if (!audioRef.current) return;
    try {
      const promise = audioRef.current.play();
      playPromiseRef.current = promise;
      if (promise !== undefined) await promise;
    } catch (error: any) {
      if (error.name !== "AbortError") {
        console.error("音频播放失败:", error);
      }
    } finally {
      playPromiseRef.current = null;
    }
  };

  const safePause = () => {
    if (!audioRef.current) return;
    if (playPromiseRef.current) {
      playPromiseRef.current
        .then(() => {
          if (audioRef.current && !audioRef.current.paused) {
            audioRef.current.pause();
          }
        })
        .catch(() => {});
    } else {
      audioRef.current.pause();
    }
  };

  const isPlayingRef = useRef(isPlaying);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    if (currentSong && currentSong.id !== currentSongIdRef.current) {
      currentSongIdRef.current = currentSong.id;
      
      // 捕获歌曲切换（或页面初次加载水合）瞬间的进度
      // 避免因为音频加载过程中的 onTimeUpdate 把 progress 错误重置为 0
      const targetProgress = progress;

      const loadAndPlay = async () => {
        try {
          const url = await getSongUrl(currentSong.id);
          if (!url) {
            showToast("这首歌暂时还听不了哦宝宝~");
            next();
            return;
          }
          if (audioRef.current) {
            audioRef.current.src = url;
            audioRef.current.load();
            const handleCanPlay = () => {
              audioRef.current?.removeEventListener("canplay", handleCanPlay);
              
              // 恢复进度
              if (targetProgress > 0) {
                audioRef.current!.currentTime = targetProgress;
                setProgress(targetProgress);
              }

              // 尊重当前的播放状态
              if (isPlayingRef.current) {
                safePlay();
              }
            };
            audioRef.current.addEventListener("canplay", handleCanPlay);
          }
        } catch (error) {
          console.error("加载歌曲失败:", error);
        }
      };
      loadAndPlay();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSong?.id, audioRef]);

  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying && audioRef.current.paused) safePlay();
    else if (!isPlaying && !audioRef.current.paused) safePause();
  }, [isPlaying, audioRef]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume / 100;
  }, [volume, audioRef]);

  const handleTimeUpdate = () => {
    if (audioRef.current && !isDragging.current) {
      setProgress(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) setDuration(audioRef.current.duration);
  };

  const handleEnded = () => next();

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (progressRef.current && audioRef.current) {
      const rect = progressRef.current.getBoundingClientRect();
      const percentage = (e.clientX - rect.left) / rect.width;
      const newTime = percentage * duration;
      audioRef.current.currentTime = newTime;
      setProgress(newTime);
    }
  };

  const handleProgressMouseDown = () => {
    isDragging.current = true;
  };

  const handleProgressMouseUp = (e: MouseEvent) => {
    if (isDragging.current && progressRef.current && audioRef.current) {
      const rect = progressRef.current.getBoundingClientRect();
      const percentage = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const newTime = percentage * duration;
      audioRef.current.currentTime = newTime;
      setProgress(newTime);
    }
    isDragging.current = false;
  };

  useEffect(() => {
    document.addEventListener("mouseup", handleProgressMouseUp);
    return () => document.removeEventListener("mouseup", handleProgressMouseUp);
  }, []);

  // ========== Media Session API (系统/键盘媒体控制) ==========
  useEffect(() => {
    if ("mediaSession" in navigator && currentSong) {
      const cover =
        currentSong?.al?.picUrl ||
        currentSong?.album?.picUrl ||
        currentSong?.coverUrl ||
        ""; 
      const artistName =
        (currentSong?.ar || currentSong?.artists || []).map((a) => a.name).join(", ") || "未知艺术家";

      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentSong.name || "未知歌曲",
        artist: artistName,
        album: currentSong.al?.name || currentSong.album?.name || "未知专辑",
        artwork: cover ? [{ src: cover, sizes: "512x512", type: "image/jpeg" }] : [],
      });
    }
  }, [currentSong]);

  useEffect(() => {
    if ("mediaSession" in navigator) {
      navigator.mediaSession.setActionHandler("play", () => {
        if (!isPlaying) togglePlay();
      });
      navigator.mediaSession.setActionHandler("pause", () => {
        if (isPlaying) togglePlay();
      });
      navigator.mediaSession.setActionHandler("previoustrack", () => {
        prev();
      });
      navigator.mediaSession.setActionHandler("nexttrack", () => {
        next();
      });
      navigator.mediaSession.setActionHandler("seekto", (details) => {
        if (audioRef.current && details.seekTime !== undefined) {
          audioRef.current.currentTime = details.seekTime;
          setProgress(details.seekTime);
        }
      });
    }

    return () => {
      if ("mediaSession" in navigator) {
        navigator.mediaSession.setActionHandler("play", null);
        navigator.mediaSession.setActionHandler("pause", null);
        navigator.mediaSession.setActionHandler("previoustrack", null);
        navigator.mediaSession.setActionHandler("nexttrack", null);
        navigator.mediaSession.setActionHandler("seekto", null);
      }
    };
  }, [isPlaying, togglePlay, prev, next, setProgress, audioRef]);

  const handleMuteToggle = () => {
    if (volume > 0) {
      previousVolume.current = volume;
      setVolume(0);
    } else {
      setVolume(previousVolume.current);
    }
  };

  const handlePlayModeToggle = () => {
    setPlayMode(playMode === "sequential" ? "random" : "sequential");
  };

  // ========== 全局快捷键 (Web Hotkeys) ==========
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 忽略输入框内的按键，避免冲突
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable) {
        return;
      }

      switch (e.key) {
        case ' ': // 空格键
          e.preventDefault();
          togglePlay();
          break;
        case 'n':
        case 'N': // 下一首
          e.preventDefault();
          next();
          break;
        case 'm':
        case 'M': // 静音/恢复
          e.preventDefault();
          handleMuteToggle();
          break;
        case 'ArrowUp': // 音量加
          e.preventDefault();
          setVolume(Math.min(100, volume + 5));
          break;
        case 'ArrowDown': // 音量减
          e.preventDefault();
          setVolume(Math.max(0, volume - 5));
          break;
        case 'ArrowRight': // 快进 10 秒
          if (audioRef.current) {
            e.preventDefault();
            const newTime = Math.min(duration, audioRef.current.currentTime + 10);
            audioRef.current.currentTime = newTime;
            setProgress(newTime);
          }
          break;
        case 'ArrowLeft': // 快退 10 秒
          if (audioRef.current) {
            e.preventDefault();
            const newTime = Math.max(0, audioRef.current.currentTime - 10);
            audioRef.current.currentTime = newTime;
            setProgress(newTime);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, next, handleMuteToggle, volume, setVolume, duration, setProgress, audioRef]);

  // 点击外部关闭播放队列
  useEffect(() => {
    if (!isQueueOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        queueRef.current &&
        !queueRef.current.contains(target) &&
        queueBtnRef.current &&
        !queueBtnRef.current.contains(target)
      ) {
        setIsQueueOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isQueueOpen]);

  const progressPercentage = duration > 0 ? (progress / duration) * 100 : 0;
  const coverUrl =
    currentSong?.al?.picUrl ||
    currentSong?.album?.picUrl ||
    currentSong?.coverUrl ||
    "/default-cover.svg";
  const artistName =
    (currentSong?.ar || currentSong?.artists || []).map((a) => a.name).join(", ") || "未知艺术家";

  return (
    <>
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />

      {/* 歌词面板 — 阻尼滑出入场 */}
      <AnimatePresence>
        {showLyrics && (
          <motion.div
            key="lyrics-panel"
            className="fixed inset-0 bottom-[72px] z-40 flex items-center justify-center"
            initial={{ y: "100%", opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "tween", ease: [0.32, 0.72, 0, 1], duration: 0.5 }}
          >
            <AmbientBackground coverUrl={coverUrl} />

            {/* 内容区 — 评论打开时退让 */}
            <motion.div
              className="relative z-10 flex w-full max-w-6xl items-start gap-16 px-12"
              animate={{
                x: isCommentOpen ? "-5%" : 0,
                scale: isCommentOpen ? 0.98 : 1,
              }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
            >
              <div className="flex flex-shrink-0 flex-col items-center">
                {currentSong ? (
                  <CoverCard3D src={coverUrl} alt={currentSong.name} />
                ) : (
                  <div className="bg-elevated border-border/30 flex h-64 w-64 items-center justify-center rounded-2xl border">
                    <Play size={40} className="text-warm-muted/20" />
                  </div>
                )}
                {/* 音乐手账 */}
                <MusicDiary
                  songId={currentSong?.id}
                  songName={currentSong?.name}
                  songArtistName={artistName}
                  songCoverUrl={coverUrl}
                />
              </div>
              <div className="h-[28rem] max-w-lg flex-1">
                <Lyrics song={currentSong} currentTime={progress} onSeek={seek} />
              </div>
            </motion.div>

            {/* 顶栏按钮 */}
            <div className="absolute top-6 right-6 z-20 flex items-center gap-2">
              <button
                onClick={() => setIsCommentOpen(!isCommentOpen)}
                className={`flex h-10 w-10 items-center justify-center rounded-full transition-all ${
                  isCommentOpen
                    ? "bg-accent/15 text-accent"
                    : "bg-accent/10 text-text-secondary hover:text-text-primary hover:bg-accent/15"
                }`}
                title="评论"
              >
                <MessageSquare size={17} />
              </button>
              <button
                onClick={() => {
                  setShowLyrics(false);
                  setIsCommentOpen(false);
                }}
                className="bg-accent/10 text-text-secondary hover:text-text-primary hover:bg-accent/15 flex h-10 w-10 items-center justify-center rounded-full transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* 评论抽屉 */}
            <CommentDrawer
              open={isCommentOpen}
              onClose={() => setIsCommentOpen(false)}
              songId={currentSong?.id ?? null}
              songName={currentSong?.name}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 播放队列面板 */}
      <AnimatePresence>
        {isQueueOpen && (
          <motion.div
            ref={queueRef}
            key="queue-panel"
            className="fixed right-4 bottom-24 z-50 flex max-h-[60vh] w-80 flex-col overflow-hidden rounded-2xl border border-white/50 bg-white/70 shadow-2xl backdrop-blur-xl"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            {/* 头部 */}
            <div className="px-4 pt-4 pb-2">
              <h3 className="text-sm font-semibold text-stone-800">当前播放</h3>
              <p className="mt-0.5 text-[11px] text-stone-400">{playlist.length} 首歌曲</p>
            </div>

            {/* 列表 */}
            <div className="scrollbar-hide flex-1 overflow-y-auto p-2">
              {playlist.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-stone-300">
                  <ListMusic size={32} strokeWidth={1} />
                  <p className="mt-2 text-xs">队列为空</p>
                </div>
              ) : (
                playlist.map((track, index) => {
                  const isCurrent = index === currentIndex;
                  const artists =
                    (track.ar || track.artists || []).map((a) => a.name).join(", ") || "未知艺术家";
                  return (
                    <div
                      key={`${track.id}-${index}`}
                      onClick={() => playSong(track)}
                      className={`group flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 ${
                        isCurrent ? "bg-rose-50/60" : "hover:bg-black/[0.03]"
                      }`}
                    >
                      {/* 当前播放指示器 */}
                      <div className="flex w-4 flex-shrink-0 items-center justify-center">
                        {isCurrent ? (
                          <AudioLines size={14} className="text-accent animate-pulse" />
                        ) : (
                          <span className="text-[11px] text-stone-300 tabular-nums">
                            {index + 1}
                          </span>
                        )}
                      </div>

                      {/* 歌曲信息 */}
                      <div className="min-w-0 flex-1">
                        <p
                          className={`truncate text-[13px] ${isCurrent ? "font-semibold text-stone-800" : "text-stone-600"}`}
                        >
                          {track.name || "未知歌曲"}
                        </p>
                        <p className="truncate text-[11px] text-stone-400">{artists}</p>
                      </div>

                      {/* 时长 + 操作按钮 */}
                      <div className="flex flex-shrink-0 items-center gap-1">
                        <span className="font-mono text-[10px] text-stone-300 tabular-nums group-hover:hidden">
                          {formatTime(track.duration)}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            playNext(track);
                          }}
                          className="hover:text-accent hover:bg-accent/10 flex h-6 w-6 cursor-pointer items-center justify-center rounded-md text-stone-400 opacity-0 transition-all duration-200 group-hover:opacity-100"
                          title="下一首播放"
                        >
                          <ListPlus size={13} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeSong(index);
                          }}
                          className="hover:text-accent hover:bg-accent/10 flex h-6 w-6 cursor-pointer items-center justify-center rounded-md text-stone-400 opacity-0 transition-all duration-200 group-hover:opacity-100"
                          title="移出队列"
                        >
                          <X size={13} strokeWidth={2} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 播放器栏 — 全宽通栏吸底 */}
      <div className="bg-surface/80 border-border/60 fixed right-0 bottom-0 left-0 z-50 h-[72px] w-full border-t shadow-[0_-4px_30px_rgba(0,0,0,0.06)] backdrop-blur-xl">
        {/* 进度条 - 顶部 */}
        <div
          ref={progressRef}
          className="bg-accent/[0.08] group absolute top-0 right-0 left-0 h-[3px] cursor-pointer"
          onClick={handleProgressClick}
          onMouseDown={handleProgressMouseDown}
        >
          <div
            className="bg-accent h-full rounded-r-full transition-none"
            style={{ width: `${progressPercentage}%` }}
          />
          <div
            className="bg-accent absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full opacity-0 shadow-[0_0_8px_rgba(212,133,138,0.4)] transition-opacity group-hover:opacity-100"
            style={{ left: `calc(${progressPercentage}% - 6px)` }}
          />
        </div>

        <div className="flex h-full items-center px-8">
          {/* 左侧：歌曲信息 */}
          <div className="flex w-64 min-w-0 items-center">
            {currentSong ? (
              <>
                <img
                  src={coverUrl}
                  alt={currentSong.al?.name || currentSong.album?.name || "未知专辑"}
                  className="ring-border/40 h-11 w-11 cursor-pointer rounded-lg ring-1 transition-opacity hover:opacity-80"
                  onClick={() => setShowLyrics(!showLyrics)}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/default-cover.svg";
                  }}
                />
                <div className="ml-3 overflow-hidden">
                  <p className="text-text-primary truncate text-[13px] font-medium">
                    {currentSong.name || "未知歌曲"}
                  </p>
                  <p className="text-text-secondary truncate text-[11px]">
                    {(currentSong.ar || currentSong.artists || []).map((a) => a.name).join(", ") ||
                      "未知艺术家"}
                  </p>
                </div>
              </>
            ) : (
              <p className="text-text-secondary/50 text-[13px]">未播放</p>
            )}
          </div>

          {/* 中间：播放控制 */}
          <div className="mx-auto flex max-w-2xl flex-1 flex-col items-center">
            <div className="flex items-center gap-6">
              <button
                onClick={prev}
                className="text-text-secondary hover:text-text-primary transition-colors"
              >
                <SkipBack size={18} strokeWidth={1.5} />
              </button>

              <button
                onClick={togglePlay}
                className="bg-accent hover:bg-accent-dim shadow-accent/25 flex h-9 w-9 items-center justify-center rounded-full text-white shadow-md transition-all hover:scale-105"
              >
                {isPlaying ? (
                  <Pause size={16} fill="currentColor" />
                ) : (
                  <Play size={16} fill="currentColor" className="ml-0.5" />
                )}
              </button>

              <button
                onClick={next}
                className="text-text-secondary hover:text-text-primary transition-colors"
              >
                <SkipForward size={18} strokeWidth={1.5} />
              </button>
            </div>

            {/* 时间显示 */}
            <div className="mt-1 flex items-center gap-3">
              <span className="text-text-secondary/60 w-10 text-right font-mono text-[10px] tabular-nums">
                {formatTime(progress * 1000)}
              </span>
              <span className="text-text-secondary/30 text-[10px]">/</span>
              <span className="text-text-secondary/60 w-10 font-mono text-[10px] tabular-nums">
                {formatTime(duration * 1000)}
              </span>
            </div>
          </div>

          {/* 右侧：音量 + 模式 */}
          <div className="flex w-64 items-center justify-end gap-4">
            <button
              onClick={handlePlayModeToggle}
              className={`transition-colors ${playMode === "random" ? "text-accent" : "text-text-secondary/40 hover:text-text-secondary"}`}
              title={playMode === "sequential" ? "顺序播放" : "随机播放"}
            >
              {playMode === "sequential" ? (
                <Repeat size={15} strokeWidth={1.5} />
              ) : (
                <Shuffle size={15} strokeWidth={1.5} />
              )}
            </button>

            <button
              onClick={() => setShowLyrics(!showLyrics)}
              className={`transition-colors ${showLyrics ? "text-accent" : "text-text-secondary/40 hover:text-text-secondary"}`}
              title="歌词"
            >
              <Mic2 size={15} strokeWidth={1.5} />
            </button>

            <button
              onClick={() => {
                if (!showLyrics) setShowLyrics(true);
                setIsCommentOpen(!isCommentOpen);
              }}
              className={`transition-colors ${isCommentOpen ? "text-accent" : "text-text-secondary/40 hover:text-text-secondary"}`}
              title="评论"
            >
              <MessageSquare size={15} strokeWidth={1.5} />
            </button>

            <button
              ref={queueBtnRef}
              onClick={() => setIsQueueOpen(!isQueueOpen)}
              className={`transition-colors ${isQueueOpen ? "text-accent" : "text-text-secondary/40 hover:text-text-secondary"}`}
              title="播放队列"
            >
              <ListMusic size={15} strokeWidth={1.5} />
            </button>

            {currentSong && (
              <>
                <button
                  ref={addBtnRef}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowPicker(!showPicker);
                  }}
                  className={`transition-colors ${showPicker ? "text-accent" : "text-text-secondary/40 hover:text-text-secondary"}`}
                  title="收录到频道"
                >
                  <FolderPlus size={15} strokeWidth={1.5} />
                </button>
                <AnimatePresence>
                  {showPicker && (
                    <ChannelPickerPopover
                      songId={currentSong.id}
                      songName={currentSong.name}
                      triggerRef={addBtnRef}
                      onClose={() => setShowPicker(false)}
                    />
                  )}
                </AnimatePresence>
              </>
            )}

            <div className="flex items-center gap-2">
              <button
                onClick={handleMuteToggle}
                className="text-text-secondary/40 hover:text-text-secondary transition-colors"
              >
                {volume === 0 ? (
                  <VolumeX size={15} strokeWidth={1.5} />
                ) : (
                  <Volume2 size={15} strokeWidth={1.5} />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => setVolume(parseInt(e.target.value, 10))}
                className="bg-border/60 accent-accent h-[3px] w-20 cursor-pointer appearance-none rounded-lg"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
