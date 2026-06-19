"use client";

import { useEffect, useRef, useState } from "react";
import { getSongUrl } from "@/lib/api";
import { showToast } from "@/components/Toast";
import type { Song, PlayMode } from "@/types";

interface AudioEngineOptions {
  currentSong: Song | null;
  isPlaying: boolean;
  volume: number;
  progress: number;
  duration: number;
  playMode: PlayMode;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  next: () => void;
  setProgress: (p: number) => void;
  setDuration: (d: number) => void;
}

export function useAudioEngine({
  currentSong,
  isPlaying,
  volume,
  progress,
  duration,
  playMode,
  audioRef,
  next,
  setProgress,
  setDuration,
}: AudioEngineOptions) {
  const playPromiseRef = useRef<Promise<void> | null>(null);
  const currentSongIdRef = useRef<number | null>(null);
  const playbackFailedCountRef = useRef(0);
  const isPlayingRef = useRef(isPlaying);
  const isDragging = useRef(false);
  const dragPercentage = useRef(0);
  const progressRef = useRef<HTMLDivElement>(null);
  const [isDraggingState, setIsDraggingState] = useState(false);
  const [displayPercentage, setDisplayPercentage] = useState(0);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

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

  // 歌曲切换时加载并播放
  useEffect(() => {
    if (currentSong && currentSong.id !== currentSongIdRef.current) {
      currentSongIdRef.current = currentSong.id;

      const targetProgress = progress;

      const loadAndPlay = async () => {
        try {
          const url = await getSongUrl(currentSong.id);
          if (!url) {
            playbackFailedCountRef.current += 1;
            if (playbackFailedCountRef.current >= 3) {
              showToast("连续多首不可播放，已暂停自动跳转");
              playbackFailedCountRef.current = 0;
              return;
            }
            showToast("这首歌暂时还听不了，自动跳到下一首");
            next();
            return;
          }
          playbackFailedCountRef.current = 0;
          if (audioRef.current) {
            audioRef.current.src = url;
            audioRef.current.load();
            const handleCanPlay = () => {
              audioRef.current?.removeEventListener("canplay", handleCanPlay);

              if (targetProgress > 0) {
                audioRef.current!.currentTime = targetProgress;
                setProgress(targetProgress);
              }

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

  // 播放/暂停状态同步
  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying && audioRef.current.paused) safePlay();
    else if (!isPlaying && !audioRef.current.paused) safePause();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, audioRef]);

  // 音量同步
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

  const handleEnded = () => {
    if (playMode === "repeat-one" && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
      setProgress(0);
    } else {
      next();
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (progressRef.current && audioRef.current) {
      const rect = progressRef.current.getBoundingClientRect();
      const percentage = (e.clientX - rect.left) / rect.width;
      const newTime = percentage * (audioRef.current.duration || 0);
      audioRef.current.currentTime = newTime;
      setProgress(newTime);
    }
  };

  const handleProgressMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current) return;
    isDragging.current = true;
    const rect = progressRef.current.getBoundingClientRect();
    dragPercentage.current = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setIsDraggingState(true);
    setDisplayPercentage(dragPercentage.current * 100);
  };

  useEffect(() => {
    const calcPercentage = (clientX: number) => {
      if (!progressRef.current) return 0;
      const rect = progressRef.current.getBoundingClientRect();
      return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const pct = calcPercentage(e.clientX);
      dragPercentage.current = pct;
      setDisplayPercentage(pct * 100);
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const pct = calcPercentage(e.clientX);
      const newTime = pct * (audioRef.current?.duration || 0);
      if (audioRef.current) {
        audioRef.current.currentTime = newTime;
      }
      setProgress(newTime);
      isDragging.current = false;
      setIsDraggingState(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [setProgress, audioRef]);

  // 计算显示用百分比：拖拽时用拖拽值，否则用实际进度
  const progressPercentage = isDraggingState
    ? displayPercentage
    : duration > 0
      ? (progress / duration) * 100
      : 0;

  return {
    progressRef,
    progressPercentage,
    isDragging: isDraggingState,
    handleTimeUpdate,
    handleLoadedMetadata,
    handleEnded,
    handleProgressClick,
    handleProgressMouseDown,
  };
}
