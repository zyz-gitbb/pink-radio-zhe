"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getSongDetailBatch } from "@/lib/api";
import { SongList } from "@/components/song-list";
import { SearchSongs } from "@/components/search-songs";
import { Music2, Plus, Check, ArrowLeft } from "lucide-react";
import { addSongToChannel, removeSongFromChannel } from "@/app/actions";
import { showToast } from "@/components/Toast";
import type { Channel, Song } from "@/types";

interface ChannelContentProps {
  channel: Channel;
}

export function ChannelContent({ channel }: ChannelContentProps) {
  const router = useRouter();
  const [songs, setSongs] = useState<Song[]>([]);
  const [songsLoading, setSongsLoading] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);

  // 首次加载歌曲详情（从网易云 API 获取完整信息）
  useState(() => {
    if (channel.songIds.length > 0) {
      getSongDetailBatch(channel.songIds)
        .then(setSongs)
        .finally(() => setSongsLoading(false));
    } else {
      setSongsLoading(false);
    }
  });

  const handleAddSong = async (song: Song) => {
    if (channel.songIds.includes(song.id)) return;

    const result = await addSongToChannel(channel.id, {
      id: song.id,
      name: song.name,
      artistName: (song.ar || song.artists || []).map((a) => a.name).join(", "),
      coverUrl: song.al?.picUrl || song.album?.picUrl || song.coverUrl,
    });

    if (result.success) {
      setSongs((prev) => [...prev, song]);
      setAddSuccess(true);
      setTimeout(() => setAddSuccess(false), 2000);
      router.refresh();
    } else if (result.reason === "duplicate") {
      showToast("这首歌已经在频道里啦");
    }
  };

  const addedSongIds = channel.songIds;

  const handleRemoveSong = useCallback(
    async (songId: number) => {
      await removeSongFromChannel(channel.id, songId);
      setSongs((prev) => prev.filter((s) => s.id !== songId));
      router.refresh();
    },
    [channel.id, router]
  );

  if (songsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-accent/40 animate-pulse" />
          <span className="text-stone-400 text-[13px]">加载歌曲中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      {/* 沉浸式微光背景 */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(212,133,138,0.12),_transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(223,218,209,0.3),_transparent_60%)]" />
        <div className="absolute inset-0 bg-background" style={{ opacity: 0.85 }} />
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(0,0,0,0.2) 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />
      </div>

      {/* 返回按钮 */}
      <div className="px-12 pt-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-stone-400 hover:text-stone-700 transition-colors mb-6 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>返回</span>
        </button>
      </div>

      {/* 频道头部 */}
      <div className="relative overflow-hidden">
        {channel.coverUrl && (
          <div className="absolute inset-0 -z-10">
            <img
              src={channel.coverUrl}
              alt=""
              className="w-full h-full object-cover blur-[80px] scale-125 opacity-20 saturate-50"
            />
            <div className="absolute inset-0 bg-background/70" />
          </div>
        )}

        <div className="px-12 pt-10 pb-8">
          <div className="flex items-end gap-8">
            <div className="flex-shrink-0">
              {channel.coverUrl ? (
                <div className="relative">
                  <img
                    src={channel.coverUrl}
                    alt={channel.name}
                    className="w-48 h-48 rounded-2xl object-cover ring-1 ring-black/5 shadow-[0_20px_50px_rgba(212,133,138,0.15)]"
                  />
                  <div className="absolute -inset-2 rounded-3xl bg-gradient-to-br from-accent/10 to-transparent -z-10 blur-2xl" />
                </div>
              ) : (
                <div className="w-48 h-48 rounded-2xl bg-elevated border border-border/30 flex items-center justify-center shadow-[0_20px_50px_rgba(0,0,0,0.06)]">
                  <Music2 size={40} className="text-stone-300" strokeWidth={1} />
                </div>
              )}
            </div>

            <div className="flex-1 pb-2">
              <p className="text-[11px] font-medium text-accent tracking-wide uppercase mb-2">
                频道
              </p>
              <h1 className="text-3xl font-bold text-stone-800 mb-2 tracking-tight">
                {channel.name}
              </h1>
              {channel.description && (
                <p className="text-stone-500 mb-4 text-[13px] leading-relaxed max-w-xl">
                  {channel.description}
                </p>
              )}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 bg-accent/10 text-accent rounded-md text-[11px] font-medium">
                  {channel.category}
                </span>
                {channel.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-0.5 bg-stone-200/60 text-stone-500 rounded-md text-[11px]"
                  >
                    {tag}
                  </span>
                ))}
                <span className="text-stone-400 text-[11px] ml-1">
                  {channel.songIds.length} 首歌
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="px-12 py-8">
        {showSearch && (
          <div className="mb-6">
            <SearchSongs onAddSong={handleAddSong} addedSongIds={addedSongIds} />
          </div>
        )}

        {songs.length > 0 ? (
          <SongList
            songs={songs}
            channelId={channel.id}
            onRemoveSong={handleRemoveSong}
            headerExtra={
              <div className="flex items-center gap-3">
                {addSuccess && (
                  <span className="flex items-center gap-1 text-accent text-[12px] font-medium animate-pulse">
                    <Check size={13} /> 已添加
                  </span>
                )}
                <button
                  onClick={() => setShowSearch(!showSearch)}
                  className={`flex items-center gap-1.5 px-4 py-1.5 text-[13px] rounded-lg transition-all font-medium ${
                    showSearch
                      ? "bg-accent/15 text-accent"
                      : "bg-accent/10 text-accent hover:bg-accent/15"
                  }`}
                >
                  <Plus size={13} />
                  {showSearch ? "收起搜索" : "添加歌曲"}
                </button>
              </div>
            }
          />
        ) : (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-surface border border-border/30 flex items-center justify-center mx-auto mb-4">
              <Music2 size={24} className="text-stone-300" strokeWidth={1} />
            </div>
            <p className="text-stone-500 text-[13px] mb-4">暂无歌曲</p>
            {!showSearch && (
              <button
                onClick={() => setShowSearch(true)}
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-accent/10 text-accent rounded-lg hover:bg-accent/15 text-[13px] font-medium transition-all"
              >
                <Plus size={14} />
                添加第一首歌
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
