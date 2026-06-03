"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { getPlaylistDetail } from "@/lib/api";
import { SongList } from "@/components/song-list";
import type { Song } from "@/types";

export default function PlaylistPage() {
  const params = useParams();
  const router = useRouter();
  const playlistId = Number(params.id);

  const [playlistInfo, setPlaylistInfo] = useState<any>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPlaylist = async () => {
      if (!playlistId || isNaN(playlistId)) {
        setError("无效的歌单 ID");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const detail = await getPlaylistDetail(playlistId);
        if (detail) {
          setPlaylistInfo(detail);
          const tracks = (detail.tracks || []) as Song[];
          if (tracks.length > 0) setSongs(tracks);
          else setError("歌单内暂无歌曲");
        } else {
          setError("歌单不存在");
        }
      } catch (err) {
        console.error("加载歌单失败:", err);
        setError("加载歌单失败，请稍后重试");
      } finally {
        setLoading(false);
      }
    };
    loadPlaylist();
  }, [playlistId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 size={24} className="text-accent animate-spin" />
        <span className="ml-3 text-stone-500 text-[13px]">加载歌单中...</span>
      </div>
    );
  }

  if (error && !playlistInfo) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-stone-500/60 text-[13px] mb-4">{error}</p>
        <Link
          href="/radio"
          className="px-4 py-1.5 bg-accent/10 text-accent rounded-lg hover:bg-accent/15 transition-all text-[13px] font-medium"
        >
          返回推荐
        </Link>
      </div>
    );
  }

  const coverUrl = playlistInfo?.coverImgUrl || playlistInfo?.picUrl || "/default-cover.svg";
  const playCount = playlistInfo?.playCount || 0;

  return (
    <div>
      {/* 歌单头部 */}
      <div className="relative h-72 overflow-hidden bg-surface">
        <img
          src={coverUrl}
          alt={playlistInfo?.name || "歌单封面"}
          className="w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 px-12 pb-8">
          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-sm text-stone-400 hover:text-stone-700 transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span>返回</span>
            </button>
          </div>
          <h1 className="text-3xl font-bold text-stone-800 mb-2 tracking-tight">
            {playlistInfo?.name || "歌单详情"}
          </h1>
          {playlistInfo?.description && (
            <p className="text-stone-500 text-[13px] mb-3 line-clamp-2 max-w-2xl">
              {playlistInfo.description}
            </p>
          )}
          <div className="flex items-center gap-4 text-[11px] text-stone-400">
            {playlistInfo?.creator?.nickname && (
              <span>{playlistInfo.creator.nickname}</span>
            )}
            {playCount > 0 && (
              <span>{playCount.toLocaleString()} 次播放</span>
            )}
            <span>{songs.length} 首歌曲</span>
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="px-12 py-8">
        {songs.length > 0 ? (
          <SongList songs={songs} />
        ) : (
          <div className="text-center py-20">
            <p className="text-stone-400/60 text-[13px]">{error || "歌单内暂无歌曲"}</p>
          </div>
        )}
      </div>
    </div>
  );
}
