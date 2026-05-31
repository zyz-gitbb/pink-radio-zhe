"use client";

import { useContext } from "react";
import { PlayerContext } from "@/contexts/player-context";
import type { Song, PlayMode } from "@/types";

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error("usePlayer must be used within PlayerProvider");
  }

  const { state, dispatch, audioRef } = context;

  return {
    // 状态
    currentSong: state.currentSong,
    isPlaying: state.isPlaying,
    volume: state.volume,
    progress: state.progress,
    duration: state.duration,
    playMode: state.playMode,
    playlist: state.playlist,
    audioRef,

    // 操作
    playSong: (song: Song) => dispatch({ type: "PLAY_SONG", song }),
    setPlaylist: (songs: Song[], startIndex?: number) =>
      dispatch({ type: "SET_PLAYLIST", songs, startIndex }),
    togglePlay: () => dispatch({ type: "TOGGLE_PLAY" }),
    pause: () => dispatch({ type: "PAUSE" }),
    play: () => dispatch({ type: "PLAY" }),
    next: () => dispatch({ type: "NEXT" }),
    prev: () => dispatch({ type: "PREV" }),
    setVolume: (volume: number) =>
      dispatch({ type: "SET_VOLUME", volume }),
    setProgress: (progress: number) =>
      dispatch({ type: "SET_PROGRESS", progress }),
    setDuration: (duration: number) =>
      dispatch({ type: "SET_DURATION", duration }),
    setPlayMode: (mode: PlayMode) =>
      dispatch({ type: "SET_PLAY_MODE", mode }),
    removeSong: (index: number) =>
      dispatch({ type: "REMOVE_SONG", index }),
    seek: (time: number) => {
      if (audioRef.current) {
        audioRef.current.currentTime = time;
      }
      dispatch({ type: "SET_PROGRESS", progress: time });
    },
  };
}
