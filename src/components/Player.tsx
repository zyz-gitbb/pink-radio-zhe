"use client";

import { useState, useEffect, useRef } from "react";
import { usePlayer } from "@/hooks/use-player";
import { useAudioEngine } from "@/hooks/use-audio-engine";
import { useMediaSession } from "@/hooks/use-media-session";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { LyricsPanel } from "@/components/player/lyrics-panel";
import { QueuePanel } from "@/components/player/queue-panel";
import { ProgressBar } from "@/components/player/progress-bar";
import { TransportControls } from "@/components/player/transport-controls";
import { RightControls } from "@/components/player/right-controls";

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
    reorderPlaylist,
    setPlaylist,
  } = usePlayer();

  const [showLyrics, setShowLyrics] = useState(false);
  const [isCommentOpen, setIsCommentOpen] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const addBtnRef = useRef<HTMLButtonElement>(null);
  const queueBtnRef = useRef<HTMLButtonElement>(null);
  const queueRef = useRef<HTMLDivElement>(null);
  const previousVolume = useRef(volume);

  // 音频引擎：加载、播放/暂停、进度同步
  const {
    progressRef,
    progressPercentage,
    isDragging,
    handleTimeUpdate,
    handleLoadedMetadata,
    handleEnded,
    handleProgressClick,
    handleProgressMouseDown,
  } = useAudioEngine({
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
  });

  // Media Session API
  useMediaSession({ currentSong, isPlaying, togglePlay, prev, next, seek });

  // 静音切换
  const handleMuteToggle = () => {
    if (volume > 0) {
      previousVolume.current = volume;
      setVolume(0);
    } else {
      setVolume(previousVolume.current);
    }
  };

  // 播放模式切换：顺序 → 随机 → 单曲循环 → 顺序
  const handlePlayModeToggle = () => {
    const next: Record<string, string> = { sequential: "random", "random": "repeat-one", "repeat-one": "sequential" };
    setPlayMode(next[playMode] as any);
  };

  // 全局快捷键
  useKeyboardShortcuts({
    togglePlay,
    next,
    volume,
    setVolume,
    duration,
    seek,
    audioRef,
    muteToggle: handleMuteToggle,
  });

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

  // 派生值
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

      {/* 歌词面板 */}
      <LyricsPanel
        show={showLyrics}
        isCommentOpen={isCommentOpen}
        setIsCommentOpen={setIsCommentOpen}
        onClose={() => setShowLyrics(false)}
        currentSong={currentSong}
        coverUrl={coverUrl}
        artistName={artistName}
        progress={progress}
        seek={seek}
      />

      {/* 播放队列面板 */}
      <QueuePanel
        isOpen={isQueueOpen}
        queueRef={queueRef}
        playlist={playlist}
        currentIndex={currentIndex}
        playSong={playSong}
        playNext={playNext}
        removeSong={removeSong}
        reorderPlaylist={reorderPlaylist}
        setPlaylist={setPlaylist}
      />

      {/* 播放器栏 — 全宽通栏吸底 */}
      <div className="bg-surface/80 border-border/60 fixed right-0 bottom-0 left-0 z-50 h-[72px] w-full border-t shadow-[0_-4px_30px_rgba(0,0,0,0.06)] backdrop-blur-xl">
        {/* 进度条 */}
        <ProgressBar
          progressRef={progressRef}
          progressPercentage={progressPercentage}
          isDragging={isDragging}
          onClick={handleProgressClick}
          onMouseDown={handleProgressMouseDown}
        />

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
          <TransportControls
            isPlaying={isPlaying}
            progress={progress}
            duration={duration}
            onPrev={prev}
            onTogglePlay={togglePlay}
            onNext={next}
          />

          {/* 右侧：音量 + 模式 */}
          <RightControls
            playMode={playMode}
            showLyrics={showLyrics}
            isCommentOpen={isCommentOpen}
            isQueueOpen={isQueueOpen}
            showPicker={showPicker}
            currentSong={currentSong}
            volume={volume}
            addBtnRef={addBtnRef}
            queueBtnRef={queueBtnRef}
            onPlayModeToggle={handlePlayModeToggle}
            onToggleLyrics={() => setShowLyrics(!showLyrics)}
            onToggleComment={() => {
              if (!showLyrics) setShowLyrics(true);
              setIsCommentOpen(!isCommentOpen);
            }}
            onToggleQueue={() => setIsQueueOpen(!isQueueOpen)}
            setShowPicker={setShowPicker}
            onMuteToggle={handleMuteToggle}
            onVolumeChange={setVolume}
          />
        </div>
      </div>
    </>
  );
}
