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
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-2">
          <div className="bg-accent/40 h-2 w-2 animate-pulse rounded-full" />
          <span className="text-[13px] text-stone-400">加载歌曲中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      {/* 沉浸式微光背景 */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(212,133,138,0.12),_transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(223,218,209,0.3),_transparent_60%)]" />
        <div className="bg-background absolute inset-0" style={{ opacity: 0.85 }} />
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
          className="group mb-6 flex items-center gap-2 text-sm text-stone-400 transition-colors hover:text-stone-700"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
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
              className="h-full w-full scale-125 object-cover opacity-20 blur-[80px] saturate-50"
            />
            <div className="bg-background/70 absolute inset-0" />
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
                    className="h-48 w-48 rounded-2xl object-cover shadow-[0_20px_50px_rgba(212,133,138,0.15)] ring-1 ring-black/5"
                  />
                  <div className="from-accent/10 absolute -inset-2 -z-10 rounded-3xl bg-gradient-to-br to-transparent blur-2xl" />
                </div>
              ) : (
                <div className="bg-elevated border-border/30 flex h-48 w-48 items-center justify-center rounded-2xl border shadow-[0_20px_50px_rgba(0,0,0,0.06)]">
                  <Music2 size={40} className="text-stone-300" strokeWidth={1} />
                </div>
              )}
            </div>

            <div className="flex-1 pb-2">
              <p className="text-accent mb-2 text-[11px] font-medium tracking-wide uppercase">
                频道
              </p>
              <h1 className="mb-2 text-3xl font-bold tracking-tight text-stone-800">
                {channel.name}
              </h1>
              {channel.description && (
                <p className="mb-4 max-w-xl text-[13px] leading-relaxed text-stone-500">
                  {channel.description}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-accent/10 text-accent rounded-md px-2.5 py-0.5 text-[11px] font-medium">
                  {channel.category}
                </span>
                {channel.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md bg-stone-200/60 px-2.5 py-0.5 text-[11px] text-stone-500"
                  >
                    {tag}
                  </span>
                ))}
                <span className="ml-1 text-[11px] text-stone-400">
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
                  <span className="text-accent flex animate-pulse items-center gap-1 text-[12px] font-medium">
                    <Check size={13} /> 已添加
                  </span>
                )}
                <button
                  onClick={() => setShowSearch(!showSearch)}
                  className={`flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-[13px] font-medium transition-all ${
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
          <div className="py-20 text-center">
            <div className="bg-surface border-border/30 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border">
              <Music2 size={24} className="text-stone-300" strokeWidth={1} />
            </div>
            <p className="mb-4 text-[13px] text-stone-500">暂无歌曲</p>
            {!showSearch && (
              <button
                onClick={() => setShowSearch(true)}
                className="bg-accent/10 text-accent hover:bg-accent/15 inline-flex items-center gap-1.5 rounded-lg px-5 py-2 text-[13px] font-medium transition-all"
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
