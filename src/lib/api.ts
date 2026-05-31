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
async function getRequest<T>(
  apiPath: string,
  params: Record<string, string> = {}
): Promise<T> {
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
      console.warn(
        `检测到版权限制或空链接（歌曲ID: ${songId}, 错误码: ${code}）`
      );
      return null;
    }

    return url;
  } catch (error) {
    console.error("Failed to get song URL:", error);
    return null;
  }
}

// 获取歌曲详情
export async function getSongDetail(songId: number): Promise<Song | null> {
  try {
    const response = await getRequest<any>("song/detail", {
      ids: songId.toString(),
    });
    return response.songs?.[0] || null;
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
    return response.songs || [];
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
      return data.data?.dailySongs || data.data?.songs || [];
    }
  } catch (e) {
    console.warn("/recommend/songs 不可用:", e);
  }
  return [];
}

// 获取私人推荐歌单（需登录）
export async function getPrivateRecommend(): Promise<{ id: number; name: string; picUrl: string }[]> {
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
    const res = await fetch(`${PROXY_BASE}/top/playlist?cat=${encodeURIComponent(cat)}&limit=${limit}&timestamp=${bust}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
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
    return response.playlist || null;
  } catch (error) {
    console.error("Failed to get playlist detail:", error);
    return null;
  }
}

// 搜索歌曲
export async function searchSongs(keyword: string): Promise<Song[]> {
  try {
    const response = await getRequest<any>("search", {
      keywords: keyword,
      limit: "20",
      type: "1",
    });
    return response.result?.songs || [];
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
export async function checkLoginQrStatus(
  key: string
): Promise<{ code: number; message?: string }> {
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
