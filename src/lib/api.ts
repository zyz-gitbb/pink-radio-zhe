import type { Song, PersonalizedResponse } from "@/types";

// 通过本地代理调用社区开源 NeteaseCloudMusicApi
const PROXY_BASE = "/api/netease";

// API 错误类
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public retryable: boolean
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// 通用 GET 请求（社区开源 API 使用 GET + query parameters）
async function getRequest<T>(apiPath: string, params: Record<string, string> = {}): Promise<T> {
  const searchParams = new URLSearchParams(params);
  const queryString = searchParams.toString();
  const url = `${PROXY_BASE}/${apiPath}${queryString ? `?${queryString}` : ""}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new ApiError(res.status, text, res.status === 429);
  }

  return res.json();
}

// 获取歌曲播放链接
export async function getSongUrl(songId: number): Promise<string | null> {
  try {
    const response = await getRequest<any>("song/url", {
      id: songId.toString(),
      br: "320000",
    });

    const songData = response.data?.[0];
    const url = songData?.url;
    const code = songData?.code;

    // 检查是否是版权限制或 VIP 歌曲
    if (!url || code === -110 || code === -200) {
      console.warn(`检测到版权限制或空链接（歌曲ID: ${songId}, 错误码: ${code}）`);
      return null;
    }

    return url;
  } catch (error) {
    console.error("Failed to get song URL:", error);
    return null;
  }
}

// 规范化歌曲数据（兼容 dt / duration / time 字段）
export function normalizeSong(s: any): Song {
  const album = s.al || s.album || undefined;
  // 搜索 API 返回的 album 有时缺少 picUrl，需要从顶层 picUrl 回退
  const coverPic = s.al?.picUrl || s.album?.picUrl || s.picUrl;
  const normalizedAlbum = album
    ? { ...album, picUrl: album.picUrl || coverPic || "" }
    : coverPic
      ? { id: 0, name: "", picUrl: coverPic }
      : undefined;
  return {
    ...s,
    duration: s.duration || s.dt || s.time || 0,
    ar: s.ar || s.artists || [],
    al: normalizedAlbum,
  };
}

// 获取歌曲详情
export async function getSongDetail(songId: number): Promise<Song | null> {
  try {
    const response = await getRequest<any>("song/detail", {
      ids: songId.toString(),
    });
    const raw = response.songs?.[0];
    return raw ? normalizeSong(raw) : null;
  } catch (error) {
    console.error("Failed to get song detail:", error);
    return null;
  }
}

// 批量获取歌曲详情
export async function getSongDetailBatch(songIds: number[]): Promise<Song[]> {
  try {
    const response = await getRequest<any>("song/detail", {
      ids: songIds.join(","),
    });
    return (response.songs || []).map(normalizeSong);
  } catch (error) {
    console.error("Failed to get song details:", error);
    return [];
  }
}

// 获取歌曲歌词（LRC 格式）
export async function getSongLyric(songId: number): Promise<string | null> {
  try {
    const response = await getRequest<any>("lyric", {
      id: songId.toString(),
    });
    return response.lrc?.lyric || null;
  } catch (error) {
    console.error("Failed to get lyrics:", error);
    return null;
  }
}

// 获取歌曲评论
export interface SongComment {
  user: { avatarUrl: string; nickname: string };
  content: string;
  likedCount: number;
  time: number;
}

export async function getSongComments(
  songId: number,
  limit = 100
): Promise<{ hotComments: SongComment[]; comments: SongComment[] }> {
  const bust = Date.now().toString();
  try {
    const res = await fetch(
      `${PROXY_BASE}/comment/music?id=${songId}&limit=${limit}&timestamp=${bust}`,
      { method: "GET", headers: { "Content-Type": "application/json" }, cache: "no-store" }
    );
    if (res.ok) {
      const data = await res.json();
      return {
        hotComments: data.hotComments || [],
        comments: data.comments || [],
      };
    }
  } catch (e) {
    console.warn("获取评论失败:", e);
  }
  return { hotComments: [], comments: [] };
}

// 获取个性化推荐（旧接口，保留作兜底）
export async function getPersonalized(): Promise<PersonalizedResponse> {
  try {
    const data = await getRequest<any>("personalized", {});
    return { result: data.result || [] };
  } catch (error) {
    console.error("Failed to get personalized:", error);
    return { result: [] };
  }
}

// 获取大批量推荐歌单池（用于前端洗牌）
export async function getRecommendationPool(
  limit = 100
): Promise<{ id: number; name: string; picUrl: string }[]> {
  const bust = Date.now().toString();
  const results: { id: number; name: string; picUrl: string }[] = [];
  const seen = new Set<number>();

  // 来源 1：/recommend/resource（私域推荐，约 10-30 条）
  try {
    const res = await fetch(`${PROXY_BASE}/recommend/resource?timestamp=${bust}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      const items = data.recommend || data.result || [];
      for (const it of items) {
        if (!seen.has(it.id)) {
          seen.add(it.id);
          results.push(it);
        }
      }
    }
  } catch {}

  // 来源 2：/personalized（公开推荐，约 10-30 条）
  try {
    const res = await fetch(`${PROXY_BASE}/personalized?timestamp=${bust}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      for (const it of data.result || []) {
        if (!seen.has(it.id)) {
          seen.add(it.id);
          results.push(it);
        }
      }
    }
  } catch {}

  // 来源 3：/top/playlist（热门歌单池，支持 limit）
  try {
    const res = await fetch(
      `${PROXY_BASE}/top/playlist?limit=${limit}&order=hot&timestamp=${bust}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      }
    );
    if (res.ok) {
      const data = await res.json();
      for (const p of data.playlists || []) {
        if (!seen.has(p.id)) {
          seen.add(p.id);
          results.push({ id: p.id, name: p.name, picUrl: p.coverImgUrl || p.picUrl });
        }
      }
    }
  } catch {}

  return results;
}

// 获取每日推荐歌曲（需登录）
export async function getDailyRecommendSongs(): Promise<Song[]> {
  const bust = Date.now().toString();
  try {
    const res = await fetch(`${PROXY_BASE}/recommend/songs?timestamp=${bust}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      const raw: any[] = data.data?.dailySongs || data.data?.songs || [];
      return raw.map(normalizeSong);
    }
  } catch (e) {
    console.warn("/recommend/songs 不可用:", e);
  }
  return [];
}

// 获取私人推荐歌单（需登录）
export async function getPrivateRecommend(): Promise<
  { id: number; name: string; picUrl: string }[]
> {
  const bust = Date.now().toString();
  try {
    const res = await fetch(`${PROXY_BASE}/personalized/privatecontent?timestamp=${bust}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      return data.result || [];
    }
  } catch (e) {
    console.warn("/personalized/privatecontent 不可用:", e);
  }
  return [];
}

// 按分类获取热门歌单（用于"华语流行日推"等入口）
export async function getTopPlaylistByCategory(
  cat: string,
  limit = 1
): Promise<{ id: number; name: string; picUrl: string; description?: string }[]> {
  const bust = Date.now().toString();
  try {
    const res = await fetch(
      `${PROXY_BASE}/top/playlist?cat=${encodeURIComponent(cat)}&limit=${limit}&timestamp=${bust}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      }
    );
    if (res.ok) {
      const data = await res.json();
      return (data.playlists || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        picUrl: p.coverImgUrl || p.picUrl,
        description: p.description,
      }));
    }
  } catch (e) {
    console.warn("/top/playlist 不可用:", e);
  }
  return [];
}

// 获取每日推荐歌单（需登录，优先使用）+ 兜底 /personalized
export async function getRecommendations(): Promise<PersonalizedResponse> {
  const bust = Date.now().toString();

  // 优先尝试 /recommend/resource（基于用户品味的私域推荐）
  try {
    const res = await fetch(`${PROXY_BASE}/recommend/resource?timestamp=${bust}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      const result = data.recommend || data.result;
      if (Array.isArray(result) && result.length > 0) {
        return { result };
      }
    }
  } catch (e) {
    console.warn("/recommend/resource 不可用，回退到 /personalized:", e);
  }

  // 兜底：/personalized（公开推荐，无需登录）
  try {
    const res = await fetch(`${PROXY_BASE}/personalized?timestamp=${bust}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      return { result: data.result || [] };
    }
  } catch (error) {
    console.error("Failed to get personalized:", error);
  }

  return { result: [] };
}

// 获取歌单详情（基础信息）
export async function getPlaylistDetail(id: number): Promise<any | null> {
  try {
    const response = await getRequest<any>("playlist/detail", {
      id: id.toString(),
    });
    const playlist = response.playlist || null;
    if (playlist?.tracks) {
      playlist.tracks = playlist.tracks.map(normalizeSong);
    }
    return playlist;
  } catch (error) {
    console.error("Failed to get playlist detail:", error);
    return null;
  }
}

// 搜索歌曲
// 搜索 API 返回的歌曲数据经常缺少封面 URL（album.picUrl 为空），
// 所以搜索后批量获取完整歌曲详情来补全封面等信息
export async function searchSongs(keyword: string): Promise<Song[]> {
  try {
    const response = await getRequest<any>("search", {
      keywords: keyword,
      limit: "20",
      type: "1",
    });
    const rawSongs: Song[] = (response.result?.songs || []).map(normalizeSong);
    if (rawSongs.length === 0) return rawSongs;

    // 检查是否缺少封面图，需要批量补全
    const needsDetail = rawSongs.some((s) => !s.al?.picUrl);
    if (!needsDetail) return rawSongs;

    // 批量获取完整歌曲详情（song/detail 接口保证返回 picUrl）
    const ids = rawSongs.map((s: Song) => s.id);
    try {
      const detailResponse = await getRequest<any>("song/detail", {
        ids: ids.join(","),
      });
      const detailMap = new Map<number, Song>();
      for (const raw of detailResponse.songs || []) {
        const song = normalizeSong(raw);
        detailMap.set(song.id, song);
      }
      // 用详情数据补全：优先用详情的完整数据，回退到搜索结果
      return rawSongs.map((s) => {
        const detail = detailMap.get(s.id);
        if (!detail) return s;
        return {
          ...s,
          al: detail.al || s.al,
          ar: detail.ar?.length ? detail.ar : s.ar,
          duration: detail.duration || s.duration,
        };
      });
    } catch {
      // 补全失败则返回原始搜索结果
      return rawSongs;
    }
  } catch (error) {
    console.error("Failed to search songs:", error);
    return [];
  }
}

// ============ 登录相关 API ============

// 获取二维码 key
export async function getLoginQrKey(): Promise<string | null> {
  try {
    const response = await getRequest<any>("login/qr/key", {
      timestamp: Date.now().toString(),
    });
    return response.data?.unikey || null;
  } catch (error) {
    console.error("Failed to get QR key:", error);
    return null;
  }
}

// 创建二维码
export async function createLoginQr(key: string): Promise<string | null> {
  try {
    const response = await getRequest<any>("login/qr/create", {
      key,
      qrimg: "true",
      timestamp: Date.now().toString(),
    });
    // 返回 base64 图片
    return response.data?.qrimg || null;
  } catch (error) {
    console.error("Failed to create QR code:", error);
    return null;
  }
}

// 检查二维码扫码状态
export async function checkLoginQrStatus(key: string): Promise<{ code: number; message?: string }> {
  try {
    const response = await getRequest<any>("login/qr/check", {
      key,
      timestamp: Date.now().toString(),
    });
    return {
      code: response.code,
      message: response.message,
    };
  } catch (error) {
    console.error("Failed to check QR status:", error);
    return { code: -1, message: "检查失败" };
  }
}

// 获取登录状态和用户信息
export async function getLoginStatus(): Promise<{
  isLogin: boolean;
  userId?: number;
  nickname?: string;
  avatarUrl?: string;
} | null> {
  try {
    const response = await getRequest<any>("login/status", {
      timestamp: Date.now().toString(),
    });

    if (response.data?.code === 200 || response.data?.account) {
      return {
        isLogin: true,
        userId: response.data.account?.id,
        nickname: response.data.profile?.nickname,
        avatarUrl: response.data.profile?.avatarUrl,
      };
    }

    return { isLogin: false };
  } catch (error) {
    console.error("Failed to get login status:", error);
    return null;
  }
}

// 退出登录
export async function logout(): Promise<boolean> {
  try {
    await getRequest<any>("logout", {
      timestamp: Date.now().toString(),
    });
    return true;
  } catch (error) {
    console.error("Failed to logout:", error);
    return false;
  }
}
