"use client";

import type { Song } from "@/types";
import { usePlayer } from "@/hooks/use-player";
import { formatTime } from "@/lib/utils";
import { Play, Pause } from "lucide-react";

interface SongListProps {
  songs: Song[];
  onPlayAll?: () => void;
}

export function SongList({ songs, onPlayAll }: SongListProps) {
  const { currentSong, isPlaying, playSong, setPlaylist } = usePlayer();

  const handlePlaySong = (song: Song) => {
    playSong(song);
  };

  const handlePlayAll = () => {
    if (songs.length > 0) {
      setPlaylist(songs, 0);
      if (onPlayAll) onPlayAll();
    }
  };

  return (
    <div>
      {/* 播放全部按钮 */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-base font-medium text-stone-800">歌曲列表</h3>
        <button
          onClick={handlePlayAll}
          className="flex items-center gap-2 px-5 py-2 bg-accent/10 text-accent rounded-lg hover:bg-accent/20 transition-all text-[13px] font-medium"
        >
          <Play size={14} fill="currentColor" />
          播放全部
        </button>
      </div>

      {/* 表头 */}
      <div className="flex items-center px-4 py-2 text-[10px] text-stone-400 uppercase tracking-[0.15em] border-b border-border/30 mb-1 font-mono">
        <span className="w-8 text-center">#</span>
        <span className="w-10 ml-3" />
        <span className="flex-1 ml-3">标题</span>
        <span className="w-48">专辑</span>
        <span className="w-16 text-right">时长</span>
      </div>

      {/* 歌曲列表 */}
      <div>
        {songs.map((song, index) => {
          const isCurrentSong = currentSong?.id === song.id;
          const isCurrentlyPlaying = isCurrentSong && isPlaying;

          const coverUrl = song.al?.picUrl || song.album?.picUrl || song.coverUrl || '/default-cover.svg';
          const albumName = song.al?.name || song.album?.name || '未知专辑';
          const artistNames = (song.ar || song.artists || []).map((a) => a.name).join(", ") || '未知艺术家';

          return (
            <div
              key={song.id}
              onClick={() => handlePlaySong(song)}
              className={`flex items-center px-4 py-2.5 rounded-lg cursor-pointer transition-colors duration-150 ${
                isCurrentSong
                  ? "bg-accent/[0.06]"
                  : "hover:bg-accent/5"
              }`}
            >
              {/* 序号 */}
              <span className={`w-8 text-center text-[13px] tabular-nums font-mono ${isCurrentSong ? "text-accent" : "text-stone-400/60"}`}>
                {isCurrentlyPlaying ? (
                  <Pause size={13} className="mx-auto text-accent" fill="currentColor" />
                ) : (
                  index + 1
                )}
              </span>

              {/* 封面 */}
              <img
                src={coverUrl}
                alt={albumName}
                className="w-9 h-9 rounded ml-3 ring-1 ring-border/20"
                onError={(e) => { (e.target as HTMLImageElement).src = '/default-cover.svg'; }}
              />

              {/* 歌曲信息 */}
              <div className="flex-1 ml-3 overflow-hidden">
                <p className={`text-[13px] truncate ${isCurrentSong ? "text-accent font-medium" : "text-stone-800"}`}>
                  {song.name || '未知歌曲'}
                </p>
                <p className="text-[11px] text-stone-500 truncate">
                  {artistNames}
                </p>
              </div>

              {/* 专辑 */}
              <div className="w-48 text-[12px] text-stone-400 truncate">
                {albumName}
              </div>

              {/* 时长 */}
              <div className="w-16 text-[12px] text-stone-400/70 text-right tabular-nums font-mono">
                {formatTime(song.duration || 0)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
