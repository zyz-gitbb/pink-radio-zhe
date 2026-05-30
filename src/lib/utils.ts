// 格式化毫秒为 MM:SS
export function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

// 生成 UUID v4
export function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// 防抖函数
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

// 节流函数
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// 限制数值范围
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// 构建网易云封面 URL
export function buildCoverUrl(id: number, size: number = 300): string {
  return `https://p1.music.126.net/${id}.jpg?param=${size}y${size}`;
}

// LRC 歌词解析器
export interface LyricLine {
  time: number; // 秒
  text: string;
}

export function parseLrc(lrc: string): LyricLine[] {
  if (!lrc) return [];

  const lines = lrc.split("\n");
  const result: LyricLine[] = [];

  for (const line of lines) {
    // 匹配 [mm:ss.xx] 或 [mm:ss.xxx] 或 [mm:ss]
    const matches = line.match(/\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]/g);
    if (!matches) continue;

    // 提取歌词文本（去掉所有时间标签）
    const text = line.replace(/\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]/g, "").trim();
    if (!text) continue;

    // 解析每个时间标签
    for (const match of matches) {
      const timeParts = match.slice(1, -1).split(":");
      const minutes = parseInt(timeParts[0], 10);
      const seconds = parseInt(timeParts[1], 10);
      const msStr = timeParts[2] || "0";
      const ms = parseInt(msStr.padEnd(3, "0"), 10);

      const time = minutes * 60 + seconds + ms / 1000;
      result.push({ time, text });
    }
  }

  // 按时间排序
  result.sort((a, b) => a.time - b.time);
  return result;
}
