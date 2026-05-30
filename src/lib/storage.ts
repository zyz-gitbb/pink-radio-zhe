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

// 频道操作
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
  } catch {}
}
