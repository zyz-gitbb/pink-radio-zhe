import { getPlaylistDetailServer } from "@/lib/server-api";
import { SongList } from "@/components/song-list";
import { BackButton } from "@/components/back-button";
import type { Song } from "@/types";
import { notFound } from "next/navigation";

interface PlaylistPageProps {
  params: Promise<{ id: string }>;
}

export default async function PlaylistPage({ params }: PlaylistPageProps) {
  const { id } = await params;
  const playlistId = Number(id);

  if (!playlistId || isNaN(playlistId)) {
    notFound();
  }

  const playlistInfo = await getPlaylistDetailServer(playlistId);

  if (!playlistInfo) {
    notFound();
  }

  const songs = (playlistInfo.tracks || []) as Song[];
  const coverUrl = playlistInfo.coverImgUrl || playlistInfo.picUrl || "/default-cover.svg";
  const playCount = playlistInfo.playCount || 0;

  return (
    <div>
      {/* 歌单头部 */}
      <div className="bg-surface relative h-72 overflow-hidden">
        <img
          src={coverUrl}
          alt={playlistInfo.name || "歌单封面"}
          className="h-full w-full object-cover opacity-30"
        />
        <div className="from-background via-background/70 absolute inset-0 bg-gradient-to-t to-transparent" />
        <div className="absolute right-0 bottom-0 left-0 px-12 pb-8">
          <div className="mb-3 flex items-center gap-2">
            <BackButton />
          </div>
          <h1 className="mb-2 text-3xl font-bold tracking-tight text-stone-800">
            {playlistInfo.name || "歌单详情"}
          </h1>
          {playlistInfo.description && (
            <p className="mb-3 line-clamp-2 max-w-2xl text-[13px] text-stone-500">
              {playlistInfo.description}
            </p>
          )}
          <div className="flex items-center gap-4 text-[11px] text-stone-400">
            {playlistInfo.creator?.nickname && <span>{playlistInfo.creator.nickname}</span>}
            {playCount > 0 && <span>{playCount.toLocaleString()} 次播放</span>}
            <span>{songs.length} 首歌曲</span>
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="px-12 py-8">
        {songs.length > 0 ? (
          <SongList songs={songs} />
        ) : (
          <div className="py-20 text-center">
            <p className="text-[13px] text-stone-400/60">歌单内暂无歌曲</p>
          </div>
        )}
      </div>
    </div>
  );
}
