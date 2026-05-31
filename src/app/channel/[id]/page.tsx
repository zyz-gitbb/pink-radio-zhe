"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { getChannelById, saveChannel } from "@/lib/storage";
import { getSongDetailBatch } from "@/lib/api";
import { SongList } from "@/components/song-list";
import { SearchSongs } from "@/components/search-songs";
import { Music2, Plus, Check } from "lucide-react";
import type { Channel, Song } from "@/types";

export default function ChannelPage() {
  const params = useParams();
  const channelId = params.id as string;

  const [channel, setChannel] = useState<Channel | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);

  const loadChannelData = async () => {
    const storedChannel = getChannelById(channelId);
    if (storedChannel) {
      setChannel(storedChannel);
      if (storedChannel.songIds.length > 0) {
        const songDetails = await getSongDetailBatch(storedChannel.songIds);
        setSongs(songDetails);
      } else {
        setSongs([]);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadChannelData();
  }, [channelId]);

  const handleAddSong = (song: Song) => {
    if (!channel) return;
    if (channel.songIds.includes(song.id)) return;
    const updatedChannel: Channel = {
      ...channel,
      songIds: [...channel.songIds, song.id],
      updatedAt: Date.now(),
    };
    saveChannel(updatedChannel);
    setChannel(updatedChannel);
    setSongs((prev) => [...prev, song]);
    setAddSuccess(true);
    setTimeout(() => setAddSuccess(false), 2000);
  };

  const addedSongIds = channel?.songIds || [];

  const handleRemoveSong = useCallback((songId: number) => {
    setSongs((prev) => prev.filter((s) => s.id !== songId));
    setChannel((prev) => {
      if (!prev) return prev;
      return { ...prev, songIds: prev.songIds.filter((id) => id !== songId) };
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-stone-500 text-[13px]">加载中...</div>
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-stone-400 text-[13px]">频道不存在</div>
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
        {/* 微弱网格纹理 */}
        <div className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, rgba(0,0,0,0.2) 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />
      </div>

      {/* 频道头部 */}
      <div className="relative overflow-hidden">
        {/* 模糊封面背景层 */}
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
            {/* 画廊级专辑封面 */}
            <div className="flex-shrink-0">
              {channel.coverUrl ? (
                <div className="relative">
                  <img
                    src={channel.coverUrl}
                    alt={channel.name}
                    className="w-48 h-48 rounded-2xl object-cover ring-1 ring-black/5 shadow-[0_20px_50px_rgba(212,133,138,0.15)]"
                  />
                  {/* 玻璃边缘光晕 */}
                  <div className="absolute -inset-2 rounded-3xl bg-gradient-to-br from-accent/10 to-transparent -z-10 blur-2xl" />
                </div>
              ) : (
                <div className="w-48 h-48 rounded-2xl bg-elevated border border-border/30 flex items-center justify-center shadow-[0_20px_50px_rgba(0,0,0,0.06)]">
                  <Music2 size={40} className="text-stone-300" strokeWidth={1} />
                </div>
              )}
            </div>

            {/* 频道信息 */}
            <div className="flex-1 pb-2">
              <p className="text-[11px] font-medium text-accent tracking-wide uppercase mb-2">频道</p>
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
                  <span key={tag} className="px-2.5 py-0.5 bg-stone-200/60 text-stone-500 rounded-md text-[11px]">
                    {tag}
                  </span>
                ))}
                <span className="text-stone-400 text-[11px] ml-1">{channel.songIds.length} 首歌</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="px-12 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-medium text-stone-800">歌曲列表</h2>
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
        </div>

        {showSearch && (
          <div className="mb-6">
            <SearchSongs onAddSong={handleAddSong} addedSongIds={addedSongIds} />
          </div>
        )}

        {songs.length > 0 ? (
          <SongList songs={songs} channelId={channelId} onRemoveSong={handleRemoveSong} />
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
