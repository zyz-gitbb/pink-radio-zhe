"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Play, MessageSquare, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { Lyrics } from "@/components/lyrics";
import { CommentDrawer } from "@/components/comment-drawer";
import { AmbientBackground } from "@/components/ambient-background";
import { MusicDiary } from "@/components/music-diary";
import { CoverCard3D } from "./cover-card-3d";
import { getSongAlbum } from "@/types";
import type { Song } from "@/types";

interface LyricsPanelProps {
  show: boolean;
  isCommentOpen: boolean;
  setIsCommentOpen: (v: boolean) => void;
  onClose: () => void;
  currentSong: Song | null;
  coverUrl: string;
  artistName: string;
  progress: number;
  seek: (time: number) => void;
}

export const LyricsPanel = function LyricsPanel({
  show,
  isCommentOpen,
  setIsCommentOpen,
  onClose,
  currentSong,
  coverUrl,
  artistName,
  progress,
  seek,
}: LyricsPanelProps) {
  const router = useRouter();
  const albumId = currentSong ? getSongAlbum(currentSong)?.id : undefined;

  const handleCoverClick = () => {
    if (albumId) {
      onClose();
      router.push(`/album/${albumId}`);
    }
  };

  return (
    <AnimatePresence>
      {show && (
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
                <CoverCard3D
                  src={coverUrl}
                  alt={currentSong.name}
                  onClick={handleCoverClick}
                />
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
                onClose();
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
  );
};
