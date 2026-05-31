import type { Channel } from "@/types";

const STORAGE_KEY = "radio_channels";

// 安全的 localStorage 读取
function safeGetItem(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

// 安全的 localStorage 写入
function safeSetItem(key: string, value: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.error("localStorage write failed:", error);
  }
}

// 频道变更事件
const CHANNEL_EVENT = "channels-changed";

export function dispatchChannelsChanged(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(CHANNEL_EVENT));
  }
}

export function onChannelsChanged(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => callback();
  window.addEventListener(CHANNEL_EVENT, handler);
  return () => window.removeEventListener(CHANNEL_EVENT, handler);
}

// ========== 分类标签管理 ==========

const CATEGORY_STORAGE_KEY = "radio_category_tags";
const DEFAULT_CATEGORIES = ["深夜放松", "工作专注", "运动节拍", "学习陪伴", "其他"];
const CATEGORIES_CHANGED_EVENT = "categories-changed";

function dispatchCategoriesChanged(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(CATEGORIES_CHANGED_EVENT));
  }
}

export function onCategoriesChanged(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => callback();
  window.addEventListener(CATEGORIES_CHANGED_EVENT, handler);
  return () => window.removeEventListener(CATEGORIES_CHANGED_EVENT, handler);
}

export function getCategories(): string[] {
  const raw = safeGetItem(CATEGORY_STORAGE_KEY);
  if (!raw) return [...DEFAULT_CATEGORIES];
  try {
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [...DEFAULT_CATEGORIES];
  } catch {
    return [...DEFAULT_CATEGORIES];
  }
}

export function saveCategories(categories: string[]): void {
  safeSetItem(CATEGORY_STORAGE_KEY, JSON.stringify(categories));
  dispatchCategoriesChanged();
}

export function addCategory(name: string): string[] {
  const cats = getCategories();
  if (!cats.includes(name)) {
    cats.push(name);
    saveCategories(cats);
  }
  return cats;
}

export function renameCategory(oldName: string, newName: string): string[] {
  const cats = getCategories();
  const idx = cats.indexOf(oldName);
  if (idx < 0) return cats;

  cats[idx] = newName;
  saveCategories(cats);

  // 同步更新所有使用旧分类名的频道
  const channels = getChannels();
  let changed = false;
  for (const ch of channels) {
    if (ch.category === oldName) {
      ch.category = newName;
      ch.updatedAt = Date.now();
      changed = true;
    }
  }
  if (changed) {
    safeSetItem(STORAGE_KEY, JSON.stringify(channels));
    dispatchChannelsChanged();
  }

  return cats;
}

export function deleteCategory(name: string): string[] {
  const cats = getCategories().filter((c) => c !== name);
  saveCategories(cats);
  return cats;
}

export function getChannelsByCategory(category: string): Channel[] {
  return getChannels().filter((ch) => ch.category === category);
}

// ========== 频道操作 ==========
export function getChannels(): Channel[] {
  const raw = safeGetItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Channel[];
  } catch {
    return [];
  }
}

export function getChannelById(id: string): Channel | undefined {
  return getChannels().find((c) => c.id === id);
}

export function saveChannel(channel: Channel): void {
  const channels = getChannels();
  const idx = channels.findIndex((c) => c.id === channel.id);
  if (idx >= 0) {
    channels[idx] = channel;
  } else {
    channels.push(channel);
  }
  safeSetItem(STORAGE_KEY, JSON.stringify(channels));
  dispatchChannelsChanged();
}

export function deleteChannel(id: string): void {
  const channels = getChannels().filter((c) => c.id !== id);
  safeSetItem(STORAGE_KEY, JSON.stringify(channels));
  dispatchChannelsChanged();
}

export function clearAllLocalData(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(CATEGORY_STORAGE_KEY);
  } catch {}
}

// ========== 收录歌曲到频道 ==========

export function addSongToChannel(channelId: string, songId: number): {
  success: boolean;
  channelName?: string;
  reason?: "duplicate" | "not_found";
} {
  const channels = getChannels();
  const idx = channels.findIndex((c) => c.id === channelId);
  if (idx < 0) return { success: false, reason: "not_found" };

  const channel = channels[idx];
  if (channel.songIds.includes(songId)) {
    return { success: false, channelName: channel.name, reason: "duplicate" };
  }

  channel.songIds.push(songId);
  channel.updatedAt = Date.now();
  channels[idx] = channel;
  safeSetItem(STORAGE_KEY, JSON.stringify(channels));
  dispatchChannelsChanged();
  return { success: true, channelName: channel.name };
}

export function removeSongFromChannel(channelId: string, songId: number): boolean {
  const channels = getChannels();
  const idx = channels.findIndex((c) => c.id === channelId);
  if (idx < 0) return false;

  const channel = channels[idx];
  const songIdx = channel.songIds.indexOf(songId);
  if (songIdx < 0) return false;

  channel.songIds.splice(songIdx, 1);
  channel.updatedAt = Date.now();
  channels[idx] = channel;
  safeSetItem(STORAGE_KEY, JSON.stringify(channels));
  dispatchChannelsChanged();
  return true;
}
