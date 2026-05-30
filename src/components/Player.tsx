"use client";

import { useState, useEffect, useRef } from "react";
import { usePlayer } from "@/hooks/use-player";
import { formatTime } from "@/lib/utils";
import { getSongUrl } from "@/lib/api";
import { Lyrics } from "@/components/lyrics";
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
  X,
} from "lucide-react";

export function Player() {
  const {
    currentSong,
    isPlaying,
    volume,
    progress,
    duration,
    playMode,
    audioRef,
    togglePlay,
    next,
    prev,
    setVolume,
    setProgress,
    setDuration,
    setPlayMode,
  } = usePlayer();

  const [showLyrics, setShowLyrics] = useState(false);
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
      playPromiseRef.current.then(() => {
        if (audioRef.current && !audioRef.current.paused) {
          audioRef.current.pause();
        }
      }).catch(() => {});
    } else {
      audioRef.current.pause();
    }
  };

  useEffect(() => {
    if (currentSong && currentSong.id !== currentSongIdRef.current) {
      currentSongIdRef.current = currentSong.id;
      const loadAndPlay = async () => {
        try {
          const url = await getSongUrl(currentSong.id);
          if (url && audioRef.current) {
            audioRef.current.src = url;
            audioRef.current.load();
            const handleCanPlay = () => {
              audioRef.current?.removeEventListener("canplay", handleCanPlay);
              safePlay();
            };
            audioRef.current.addEventListener("canplay", handleCanPlay);
          }
        } catch (error) {
          console.error("加载歌曲失败:", error);
        }
      };
      loadAndPlay();
    }
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

  const handleProgressMouseDown = () => { isDragging.current = true; };

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

  const progressPercentage = duration > 0 ? (progress / duration) * 100 : 0;
  const coverUrl = currentSong?.al?.picUrl || currentSong?.album?.picUrl || currentSong?.coverUrl || '/default-cover.svg';

  return (
    <>
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />

      {/* 歌词面板 */}
      {showLyrics && (
        <div className="fixed inset-0 bottom-[72px] z-40 flex items-center justify-center">
          <div className="absolute inset-0 bg-background/95 backdrop-blur-3xl">
            <div
              className="absolute inset-0 opacity-[0.08]"
              style={{
                backgroundImage: `url(${coverUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                filter: "blur(120px) saturate(0.3)",
              }}
            />
          </div>

          <div className="relative z-10 flex items-center gap-16 px-12 max-w-6xl w-full">
            <div className="flex-shrink-0">
              {currentSong ? (
                <div className="relative">
                  <img
                    src={coverUrl}
                    alt={currentSong.name}
                    className="w-64 h-64 rounded-2xl ring-1 ring-black/5 shadow-[0_20px_50px_rgba(212,133,138,0.15)]"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/default-cover.svg'; }}
                  />
                  <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-accent/15 to-transparent -z-10 blur-xl" />
                </div>
              ) : (
                <div className="w-64 h-64 rounded-2xl bg-elevated border border-border/30 flex items-center justify-center">
                  <Play size={40} className="text-warm-muted/20" />
                </div>
              )}
            </div>
            <div className="flex-1 max-w-lg h-[28rem]">
              <Lyrics song={currentSong} currentTime={progress} />
            </div>
          </div>

          <button
            onClick={() => setShowLyrics(false)}
            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-accent/15 transition-all"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* 播放器栏 — 全宽通栏吸底 */}
      <div className="fixed bottom-0 left-0 right-0 w-full h-[72px] bg-surface/80 backdrop-blur-xl border-t border-border/60 z-50 shadow-[0_-4px_30px_rgba(0,0,0,0.06)]">
        {/* 进度条 - 顶部 */}
        <div
          ref={progressRef}
          className="absolute top-0 left-0 right-0 h-[3px] bg-accent/[0.08] cursor-pointer group"
          onClick={handleProgressClick}
          onMouseDown={handleProgressMouseDown}
        >
          <div
            className="h-full bg-accent rounded-r-full transition-none"
            style={{ width: `${progressPercentage}%` }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-accent rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-[0_0_8px_rgba(212,133,138,0.4)]"
            style={{ left: `calc(${progressPercentage}% - 6px)` }}
          />
        </div>

        <div className="flex items-center h-full px-8">
          {/* 左侧：歌曲信息 */}
          <div className="flex items-center w-64 min-w-0">
            {currentSong ? (
              <>
                <img
                  src={coverUrl}
                  alt={currentSong.al?.name || currentSong.album?.name || '未知专辑'}
                  className="w-11 h-11 rounded-lg cursor-pointer hover:opacity-80 transition-opacity ring-1 ring-border/40"
                  onClick={() => setShowLyrics(!showLyrics)}
                  onError={(e) => { (e.target as HTMLImageElement).src = '/default-cover.svg'; }}
                />
                <div className="ml-3 overflow-hidden">
                  <p className="text-[13px] font-medium truncate text-text-primary">
                    {currentSong.name || '未知歌曲'}
                  </p>
                  <p className="text-[11px] text-text-secondary truncate">
                    {(currentSong.ar || currentSong.artists || []).map((a) => a.name).join(", ") || '未知艺术家'}
                  </p>
                </div>
              </>
            ) : (
              <p className="text-text-secondary/50 text-[13px]">未播放</p>
            )}
          </div>

          {/* 中间：播放控制 */}
          <div className="flex-1 flex flex-col items-center max-w-2xl mx-auto">
            <div className="flex items-center gap-6">
              <button
                onClick={prev}
                className="text-text-secondary hover:text-text-primary transition-colors"
              >
                <SkipBack size={18} strokeWidth={1.5} />
              </button>

              <button
                onClick={togglePlay}
                className="w-9 h-9 rounded-full bg-accent flex items-center justify-center text-white hover:bg-accent-dim hover:scale-105 transition-all shadow-md shadow-accent/25"
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
            <div className="flex items-center gap-3 mt-1">
              <span className="text-[10px] text-text-secondary/60 tabular-nums w-10 text-right font-mono">
                {formatTime(progress * 1000)}
              </span>
              <span className="text-[10px] text-text-secondary/30">/</span>
              <span className="text-[10px] text-text-secondary/60 tabular-nums w-10 font-mono">
                {formatTime(duration * 1000)}
              </span>
            </div>
          </div>

          {/* 右侧：音量 + 模式 */}
          <div className="flex items-center gap-4 w-64 justify-end">
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
                className="w-20 h-[3px] bg-border/60 rounded-lg appearance-none cursor-pointer accent-accent"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
