"use client";

import { useState, useEffect, useCallback } from "react";

export interface DiaryEntry {
  id: string;
  content: string;
  timestamp: string;
}

export function useMusicDiary(songId: number | null | undefined) {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  const storageKey = songId != null ? `music_diary_${songId}` : null;

  // 当 songId 变化时，立刻从 localStorage 读取对应记录
  useEffect(() => {
    setLoaded(false);
    if (!storageKey) {
      setEntries([]);
      setLoaded(true);
      return;
    }
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        // 兼容旧版单条记录格式：自动包装为数组
        if (Array.isArray(parsed)) {
          setEntries(parsed);
        } else if (parsed && typeof parsed === "object" && parsed.content) {
          const migrated: DiaryEntry = {
            id: generateId(),
            content: parsed.content,
            timestamp: parsed.timestamp || "",
          };
          setEntries([migrated]);
          // 静默迁移写回新格式
          localStorage.setItem(storageKey, JSON.stringify([migrated]));
        } else {
          setEntries([]);
        }
      } else {
        setEntries([]);
      }
    } catch {
      setEntries([]);
    }
    setLoaded(true);
  }, [storageKey]);

  // 新增记录（插入到数组最前方）
  const save = useCallback(
    (content: string): boolean => {
      if (!storageKey || !content.trim()) return false;
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, "0");
      const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
      const newEntry: DiaryEntry = {
        id: generateId(),
        content: content.trim(),
        timestamp,
      };
      const updated = [newEntry, ...entries];
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
        setEntries(updated);
        return true;
      } catch {
        return false;
      }
    },
    [storageKey, entries]
  );

  // 删除单条记录
  const remove = useCallback(
    (id: string) => {
      if (!storageKey) return;
      const updated = entries.filter((e) => e.id !== id);
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch {}
      setEntries(updated);
    },
    [storageKey, entries]
  );

  return { entries, loaded, save, remove };
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
