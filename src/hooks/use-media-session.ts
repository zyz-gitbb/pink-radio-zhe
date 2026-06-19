"use client";

import { useEffect } from "react";
import type { Song } from "@/types";

interface MediaSessionOptions {
  currentSong: Song | null;
  isPlaying: boolean;
  togglePlay: () => void;
  prev: () => void;
  next: () => void;
  seek: (time: number) => void;
}

export function useMediaSession({
  currentSong,
  isPlaying,
  togglePlay,
  prev,
  next,
  seek,
}: MediaSessionOptions) {
  // 更新媒体元数据
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

  // 注册媒体控制回调
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
        if (details.seekTime !== undefined) {
          seek(details.seekTime);
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
  }, [isPlaying, togglePlay, prev, next, seek]);
}
