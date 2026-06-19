import { cookies } from "next/headers";
import type { Song, PersonalizedResponse } from "@/types";
import { normalizeSong } from "@/lib/api";

const NETEASE_API_BASE = process.env.NETEASE_API_BASE_URL || "http://localhost:4000";

async function serverFetch(apiPath: string, init?: RequestInit): Promise<Response> {
  const cookieStore = await cookies();
  const cookieString = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const headers = new Headers(init?.headers);
  if (cookieString) {
    headers.set("cookie", cookieString);
  }

  // 构建完整的 URL
  const url = `${NETEASE_API_BASE}/${apiPath}`;
  return fetch(url, {
    ...init,
    headers,
    cache: "no-store",
  });
}

export async function getPlaylistDetailServer(id: number): Promise<any | null> {
  try {
    const res = await serverFetch(`playlist/detail?id=${id}`);
    if (!res.ok) return null;
    const data = await res.json();
    const playlist = data.playlist || null;
    if (playlist?.tracks) {
      playlist.tracks = playlist.tracks.map(normalizeSong);
    }
    return playlist;
  } catch (error) {
    console.error("Server fetch playlist error:", error);
    return null;
  }
}

export async function getAlbumDetailServer(id: number): Promise<any | null> {
  try {
    const res = await serverFetch(`album?id=${id}`);
    if (!res.ok) return null;
    const data = await res.json();
    const album = data.album || null;
    if (album && data.songs) {
      album.songs = data.songs.map(normalizeSong);
    }
    return album;
  } catch (error) {
    console.error("Server fetch album error:", error);
    return null;
  }
}

export async function getRecommendationsServer(): Promise<PersonalizedResponse> {
  const bust = Date.now().toString();
  try {
    const res = await serverFetch(`recommend/resource?timestamp=${bust}`);
    if (res.ok) {
      const data = await res.json();
      const result = data.recommend || data.result;
      if (Array.isArray(result) && result.length > 0) return { result };
    }
  } catch {}

  try {
    const res = await serverFetch(`personalized?timestamp=${bust}`);
    if (res.ok) {
      const data = await res.json();
      return { result: data.result || [] };
    }
  } catch {}
  return { result: [] };
}

export async function getDailyRecommendSongsServer(): Promise<Song[]> {
  const bust = Date.now().toString();
  try {
    const res = await serverFetch(`recommend/songs?timestamp=${bust}`);
    if (res.ok) {
      const data = await res.json();
      const raw = data.data?.dailySongs || data.data?.songs || [];
      return raw.map(normalizeSong);
    }
  } catch {}
  return [];
}

export async function getRecommendationPoolServer(
  limit = 100
): Promise<{ id: number; name: string; picUrl: string }[]> {
  const bust = Date.now().toString();
  const results: { id: number; name: string; picUrl: string }[] = [];
  const seen = new Set<number>();

  const processItems = (items: any[]) => {
    for (const it of items) {
      if (!seen.has(it.id)) {
        seen.add(it.id);
        results.push({ id: it.id, name: it.name, picUrl: it.coverImgUrl || it.picUrl });
      }
    }
  };

  try {
    const res = await serverFetch(`recommend/resource?timestamp=${bust}`);
    if (res.ok) processItems((await res.json()).recommend || []);
  } catch {}

  try {
    const res = await serverFetch(`personalized?timestamp=${bust}`);
    if (res.ok) processItems((await res.json()).result || []);
  } catch {}

  try {
    const res = await serverFetch(`top/playlist?limit=${limit}&order=hot&timestamp=${bust}`);
    if (res.ok) processItems((await res.json()).playlists || []);
  } catch {}

  return results;
}
