// 歌曲相关类型（支持官方 API 和社区开源 API 两种格式）
export interface Song {
  id: number;
  name: string;
  // 官方 API 格式
  artists?: Artist[];
  album?: Album;
  // 社区开源 API 格式（字段名缩写）
  ar?: Artist[];
  al?: Album;
  // 兼容字段
  duration: number;
  coverUrl?: string;
  playUrl?: string | null;
}

export interface Artist {
  id: number;
  name: string;
}

export interface Album {
  id: number;
  name: string;
  picUrl: string;
}

// 辅助函数：获取歌曲的艺术家列表（兼容两种格式）
export function getSongArtists(song: Song): Artist[] {
  return song.ar || song.artists || [];
}

// 辅助函数：获取歌曲的专辑信息（兼容两种格式）
export function getSongAlbum(song: Song): Album | undefined {
  return song.al || song.album;
}

// 辅助函数：获取歌曲封面 URL（兼容两种格式）
export function getSongCoverUrl(song: Song): string {
  return song.al?.picUrl || song.album?.picUrl || song.coverUrl || '/default-cover.svg';
}

// 辅助函数：获取歌曲艺术家名称（兼容两种格式）
export function getSongArtistNames(song: Song): string {
  const artists = getSongArtists(song);
  return artists.map((a) => a.name).join(", ") || "未知艺术家";
}

// 辅助函数：获取专辑名称（兼容两种格式）
export function getSongAlbumName(song: Song): string {
  return getSongAlbum(song)?.name || "未知专辑";
}

// 频道相关类型
export interface Channel {
  id: string;
  name: string;
  description: string;
  coverUrl: string;
  category: ChannelCategory;
  tags: string[];
  songIds: number[];
  createdAt: number;
  updatedAt: number;
}

export type ChannelCategory =
  | "深夜放松"
  | "工作专注"
  | "运动节拍"
  | "学习陪伴"
  | "其他";

// 播放器相关类型
export type PlayMode = "sequential" | "random";

export interface PlayerState {
  currentSong: Song | null;
  isPlaying: boolean;
  volume: number;
  progress: number;
  duration: number;
  playMode: PlayMode;
  playlist: Song[];
  currentIndex: number;
}

export type PlayerAction =
  | { type: "PLAY_SONG"; song: Song }
  | { type: "SET_PLAYLIST"; songs: Song[]; startIndex?: number }
  | { type: "TOGGLE_PLAY" }
  | { type: "PAUSE" }
  | { type: "PLAY" }
  | { type: "NEXT" }
  | { type: "PREV" }
  | { type: "SET_VOLUME"; volume: number }
  | { type: "SET_PROGRESS"; progress: number }
  | { type: "SET_DURATION"; duration: number }
  | { type: "SET_PLAY_MODE"; mode: PlayMode }
  | { type: "REMOVE_SONG"; index: number };

// API 相关类型
export interface NetEaseResponse<T> {
  code: number;
  result?: T;
  data?: T;
  message?: string;
}

export interface SongUrlResponse {
  id: number;
  url: string | null;
  freeTrialInfo?: { start: number; end: number };
}

export interface PersonalizedResponse {
  result: { id: number; name: string; picUrl: string; tracks?: any[] }[];
}

export interface ApiError {
  code: number;
  message: string;
  retryable: boolean;
}
