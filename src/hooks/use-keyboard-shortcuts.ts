"use client";

import { useEffect } from "react";

interface KeyboardShortcutsOptions {
  togglePlay: () => void;
  next: () => void;
  volume: number;
  setVolume: (v: number) => void;
  duration: number;
  seek: (time: number) => void;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  muteToggle: () => void;
}

export function useKeyboardShortcuts({
  togglePlay,
  next,
  volume,
  setVolume,
  duration,
  seek,
  audioRef,
  muteToggle,
}: KeyboardShortcutsOptions) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) || target.isContentEditable) {
        return;
      }

      switch (e.key) {
        case " ":
          e.preventDefault();
          togglePlay();
          break;
        case "n":
        case "N":
          e.preventDefault();
          next();
          break;
        case "m":
        case "M":
          e.preventDefault();
          muteToggle();
          break;
        case "ArrowUp":
          e.preventDefault();
          setVolume(Math.min(100, volume + 5));
          break;
        case "ArrowDown":
          e.preventDefault();
          setVolume(Math.max(0, volume - 5));
          break;
        case "ArrowRight":
          if (audioRef.current) {
            e.preventDefault();
            const newTime = Math.min(duration, audioRef.current.currentTime + 10);
            seek(newTime);
          }
          break;
        case "ArrowLeft":
          if (audioRef.current) {
            e.preventDefault();
            const newTime = Math.max(0, audioRef.current.currentTime - 10);
            seek(newTime);
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [togglePlay, next, muteToggle, volume, setVolume, duration, seek, audioRef]);
}
