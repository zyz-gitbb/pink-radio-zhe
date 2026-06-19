import { getAlbumDetailServer } from "@/lib/server-api";
import { SongList } from "@/components/song-list";
import { BackButton } from "@/components/back-button";
import type { Song } from "@/types";
import { notFound } from "next/navigation";

interface AlbumPageProps {
  params: Promise<{ id: string }>;
}

export default async function AlbumPage({ params }: AlbumPageProps) {
  const { id } = await params;
  const albumId = Number(id);

  if (!albumId || isNaN(albumId)) {
    notFound();
  }

  const albumInfo = await getAlbumDetailServer(albumId);

  if (!albumInfo) {
    notFound();
  }

  const songs = (albumInfo.songs || []) as Song[];
  const coverUrl = albumInfo.picUrl || "/default-cover.svg";
  const artistName = albumInfo.artist?.name || albumInfo.artists?.[0]?.name || "";

  return (
    <div>
      {/* 专辑头部 */}
      <div className="bg-surface relative h-72 overflow-hidden">
        <img
          src={coverUrl}
          alt={albumInfo.name || "专辑封面"}
          className="h-full w-full object-cover opacity-30"
        />
        <div className="from-background via-background/70 absolute inset-0 bg-gradient-to-t to-transparent" />
        <div className="absolute right-0 bottom-0 left-0 px-12 pb-8">
          <div className="mb-3 flex items-center gap-2">
            <BackButton />
          </div>
          <h1 className="mb-2 text-3xl font-bold tracking-tight text-stone-800">
            {albumInfo.name || "专辑详情"}
          </h1>
          {artistName && (
            <p className="mb-2 text-[14px] text-stone-500">{artistName}</p>
          )}
          {albumInfo.description && (
            <p className="mb-3 line-clamp-2 max-w-2xl text-[13px] text-stone-500">
              {albumInfo.description}
            </p>
          )}
          <div className="flex items-center gap-4 text-[11px] text-stone-400">
            {albumInfo.publishTime && (
              <span>
                {new Date(albumInfo.publishTime).toLocaleDateString("zh-CN")}
              </span>
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
          <div className="py-20 text-center">
            <p className="text-[13px] text-stone-400/60">专辑内暂无歌曲</p>
          </div>
        )}
      </div>
    </div>
  );
}
