"use client";

import { createContext, useReducer, useRef, useEffect, ReactNode } from "react";
import type { PlayerState, PlayerAction, Song } from "@/types";

const initialState: PlayerState = {
  currentSong: null,
  isPlaying: false,
  volume: 80,
  progress: 0,
  duration: 0,
  playMode: "sequential",
  playlist: [],
  currentIndex: -1,
  priorityQueue: [],
};

function playerReducer(state: PlayerState, action: PlayerAction): PlayerState {
  switch (action.type) {
    case "PLAY_SONG": {
      const { song } = action;
      const existingIndex = state.playlist.findIndex((s) => s.id === song.id);

      if (existingIndex >= 0) {
        return {
          ...state,
          currentSong: song,
          isPlaying: true,
          currentIndex: existingIndex,
          progress: 0,
        };
      }

      return {
        ...state,
        currentSong: song,
        isPlaying: true,
        playlist: [...state.playlist, song],
        currentIndex: state.playlist.length,
        progress: 0,
      };
    }

    case "SET_PLAYLIST": {
      const { songs, startIndex = 0 } = action;
      return {
        ...state,
        playlist: songs,
        currentSong: songs[startIndex] || null,
        currentIndex: startIndex,
        isPlaying: songs.length > 0,
        progress: 0,
      };
    }

    case "TOGGLE_PLAY":
      return {
        ...state,
        isPlaying: !state.isPlaying,
      };

    case "PAUSE":
      return {
        ...state,
        isPlaying: false,
      };

    case "PLAY":
      return {
        ...state,
        isPlaying: true,
      };

    case "NEXT": {
      // 优先队列绝对优先 — 不受随机/循环模式影响
      if (state.priorityQueue.length > 0) {
        const nextTrack = state.priorityQueue[0];
        const remaining = state.priorityQueue.slice(1);
        const newPlaylist = [...state.playlist];
        const insertAt = state.currentIndex + 1;
        newPlaylist.splice(insertAt, 0, nextTrack);

        return {
          ...state,
          playlist: newPlaylist,
          currentSong: nextTrack,
          currentIndex: insertAt,
          isPlaying: true,
          priorityQueue: remaining,
          progress: 0,
        };
      }

      if (state.playlist.length === 0) return state;

      let nextIndex: number;
      if (state.playMode === "random") {
        nextIndex = Math.floor(Math.random() * state.playlist.length);
      } else {
        nextIndex = (state.currentIndex + 1) % state.playlist.length;
      }

      return {
        ...state,
        currentSong: state.playlist[nextIndex],
        currentIndex: nextIndex,
        isPlaying: true,
        progress: 0,
      };
    }

    case "PREV": {
      if (state.playlist.length === 0) return state;

      let prevIndex: number;
      if (state.playMode === "random") {
        prevIndex = Math.floor(Math.random() * state.playlist.length);
      } else {
        prevIndex = state.currentIndex > 0 ? state.currentIndex - 1 : state.playlist.length - 1;
      }

      return {
        ...state,
        currentSong: state.playlist[prevIndex],
        currentIndex: prevIndex,
        isPlaying: true,
        progress: 0,
      };
    }

    case "PLAY_NEXT": {
      const { song } = action;
      return {
        ...state,
        priorityQueue: [...state.priorityQueue, song],
      };
    }

    case "SET_VOLUME":
      return {
        ...state,
        volume: action.volume,
      };

    case "SET_PROGRESS":
      return {
        ...state,
        progress: action.progress,
      };

    case "SET_DURATION":
      return {
        ...state,
        duration: action.duration,
      };

    case "SET_PLAY_MODE":
      return {
        ...state,
        playMode: action.mode,
      };

    case "REMOVE_SONG": {
      const { index } = action;
      const newPlaylist = state.playlist.filter((_, i) => i !== index);
      let newIndex = state.currentIndex;
      let newCurrentSong = state.currentSong;

      if (index < state.currentIndex) {
        newIndex = state.currentIndex - 1;
      } else if (index === state.currentIndex) {
        if (newPlaylist.length === 0) {
          newIndex = -1;
          newCurrentSong = null;
        } else if (newIndex >= newPlaylist.length) {
          newIndex = newPlaylist.length - 1;
          newCurrentSong = newPlaylist[newIndex];
        } else {
          newCurrentSong = newPlaylist[newIndex];
        }
      }

      return {
        ...state,
        playlist: newPlaylist,
        currentIndex: newIndex,
        currentSong: newCurrentSong,
        progress: newCurrentSong?.id !== state.currentSong?.id ? 0 : state.progress,
      };
    }

    case "HYDRATE_STATE": {
      return {
        ...state,
        ...action.state,
        isPlaying: false, // 避免刷新页面后自动播放
      };
    }

    default:
      return state;
  }
}

interface PlayerContextValue {
  state: PlayerState;
  dispatch: React.Dispatch<PlayerAction>;
  audioRef: React.RefObject<HTMLAudioElement | null>;
}

export const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(playerReducer, initialState);
  const audioRef = useRef<HTMLAudioElement>(null);

  // 从 localStorage 恢复音量设置
  useEffect(() => {
    const savedVolume = localStorage.getItem("radio_volume");
    if (savedVolume) {
      dispatch({ type: "SET_VOLUME", volume: parseInt(savedVolume, 10) });
    }
  }, []);

  // 保存音量设置到 localStorage
  useEffect(() => {
    localStorage.setItem("radio_volume", state.volume.toString());
  }, [state.volume]);

  // 从 localStorage 恢复完整的播放器状态
  useEffect(() => {
    try {
      const savedState = localStorage.getItem("radio_playback_state");
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        dispatch({ type: "HYDRATE_STATE", state: parsedState });
      }
    } catch (e) {
      console.error("Failed to restore playback state:", e);
    }
  }, []);

  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // 核心状态改变时立即保存（包含 progress，切换时通常为 0）
  useEffect(() => {
    const stateToSave = {
      currentSong: state.currentSong,
      playlist: state.playlist,
      playMode: state.playMode,
      currentIndex: state.currentIndex,
      priorityQueue: state.priorityQueue,
      progress: state.progress,
    };
    localStorage.setItem("radio_playback_state", JSON.stringify(stateToSave));
  }, [state.currentSong, state.playlist, state.playMode, state.currentIndex, state.priorityQueue]);

  // 定期持久化进度
  useEffect(() => {
    const saveState = () => {
      const currentState = stateRef.current;
      const stateToSave = {
        currentSong: currentState.currentSong,
        playlist: currentState.playlist,
        playMode: currentState.playMode,
        currentIndex: currentState.currentIndex,
        priorityQueue: currentState.priorityQueue,
        progress: currentState.progress,
      };
      localStorage.setItem("radio_playback_state", JSON.stringify(stateToSave));
    };

    // 离开页面前强制保存
    window.addEventListener("beforeunload", saveState);

    // 每 3 秒自动保存一次（仅在播放时）
    const interval = setInterval(() => {
      if (stateRef.current.isPlaying) {
        saveState();
      }
    }, 3000);

    return () => {
      window.removeEventListener("beforeunload", saveState);
      clearInterval(interval);
    };
  }, []);

  return (
    <PlayerContext.Provider value={{ state, dispatch, audioRef }}>
      {children}
    </PlayerContext.Provider>
  );
}
