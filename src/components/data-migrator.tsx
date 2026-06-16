"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  saveChannel,
  addSongToChannel,
  saveDiary,
  addCategory,
  getCategories,
} from "@/app/actions";
import type { Channel } from "@/types";

const MIGRATION_KEY = "db_migration_done";
const CHANNELS_KEY = "radio_channels";
const CATEGORIES_KEY = "radio_category_tags";

type MigrationStatus = "idle" | "migrating" | "done";

export function DataMigrator() {
  const router = useRouter();
  const [status, setStatus] = useState<MigrationStatus>("idle");
  const [progress, setProgress] = useState("");

  useEffect(() => {
    // 已迁移过，跳过
    if (localStorage.getItem(MIGRATION_KEY) === "true") return;

    // 检测老数据是否存在
    const raw = localStorage.getItem(CHANNELS_KEY);
    if (!raw) {
      // 没有老频道数据，但可能有手账数据
      const hasDiary = hasLegacyDiaryData();
      if (!hasDiary) {
        localStorage.setItem(MIGRATION_KEY, "true");
        return;
      }
    }

    // 开始迁移
    runMigration();
  }, []);

  async function runMigration() {
    setStatus("migrating");
    try {
      // 1. 迁移分类标签
      await migrateCategories();

      // 2. 迁移频道及其歌曲
      await migrateChannels();

      // 3. 迁移手账
      await migrateDiaries();

      // 4. 标记完成
      localStorage.setItem(MIGRATION_KEY, "true");
      setStatus("done");
      setProgress("迁移完成，即将刷新...");

      // 延迟刷新，让用户看到完成提示
      setTimeout(() => {
        router.refresh();
      }, 1200);
    } catch (error) {
      console.error("数据迁移失败:", error);
      setProgress("迁移遇到问题，下次访问将重试");
      // 不标记完成，下次会重试
      setTimeout(() => setStatus("idle"), 3000);
    }
  }

  async function migrateCategories() {
    setProgress("同步分类标签...");
    const raw = localStorage.getItem(CATEGORIES_KEY);
    if (!raw) return;

    try {
      const oldCategories: string[] = JSON.parse(raw);
      if (!Array.isArray(oldCategories) || oldCategories.length === 0) return;

      // 获取数据库中已有的分类（getCategories 会自动写入默认分类）
      const existing = await getCategories();

      for (const cat of oldCategories) {
        if (!existing.includes(cat)) {
          await addCategory(cat);
        }
      }
    } catch {
      // 分类迁移失败不阻塞整体流程
    }
  }

  async function migrateChannels() {
    const raw = localStorage.getItem(CHANNELS_KEY);
    if (!raw) return;

    let oldChannels: Channel[];
    try {
      oldChannels = JSON.parse(raw);
    } catch {
      return;
    }

    if (!Array.isArray(oldChannels) || oldChannels.length === 0) return;

    const total = oldChannels.length;
    for (let i = 0; i < total; i++) {
      const ch = oldChannels[i];
      setProgress(`同步频道 (${i + 1}/${total}): ${ch.name}`);

      // 保存频道元数据
      await saveChannel({
        id: ch.id,
        name: ch.name,
        description: ch.description || "",
        coverUrl: ch.coverUrl || "",
        category: ch.category || "其他",
        tags: ch.tags || [],
        createdAt: ch.createdAt || Date.now(),
        updatedAt: ch.updatedAt || Date.now(),
      });

      // 迁移歌曲关联（仅存 songId，元数据留空，前端会从 API 获取完整信息）
      if (ch.songIds && ch.songIds.length > 0) {
        for (const songId of ch.songIds) {
          await addSongToChannel(ch.id, {
            id: songId,
            name: "",
            artistName: "",
            coverUrl: "",
          });
        }
      }
    }
  }

  async function migrateDiaries() {
    setProgress("同步音乐手账...");
    const diaryEntries = collectLegacyDiaries();
    if (diaryEntries.length === 0) return;

    const total = diaryEntries.length;
    for (let i = 0; i < total; i++) {
      const entry = diaryEntries[i];
      setProgress(`同步手账 (${i + 1}/${total})`);

      await saveDiary({
        content: entry.content,
        songId: entry.songId,
        songName: "",
        artistName: "",
        coverUrl: "",
      });
    }
  }

  // 收集所有 music_diary_* 的老数据
  function collectLegacyDiaries(): { songId: number; content: string; timestamp: string }[] {
    const results: { songId: number; content: string; timestamp: string }[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith("music_diary_")) continue;

      const songId = parseInt(key.replace("music_diary_", ""), 10);
      if (isNaN(songId)) continue;

      try {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const parsed = JSON.parse(raw);

        let entries: { content: string; timestamp: string }[];
        if (Array.isArray(parsed)) {
          entries = parsed;
        } else if (parsed && typeof parsed === "object" && parsed.content) {
          entries = [{ content: parsed.content, timestamp: parsed.timestamp || "" }];
        } else {
          continue;
        }

        for (const entry of entries) {
          if (entry.content) {
            results.push({ songId, content: entry.content, timestamp: entry.timestamp || "" });
          }
        }
      } catch {
        // skip malformed entries
      }
    }

    // 按时间排序（旧的在前，保证写入顺序）
    return results.sort((a, b) => (a.timestamp || "").localeCompare(b.timestamp || ""));
  }

  function hasLegacyDiaryData(): boolean {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("music_diary_")) return true;
    }
    return false;
  }

  // 不渲染任何内容（静默迁移）
  if (status === "idle") return null;

  return (
    <div className="pointer-events-none fixed top-0 right-0 left-0 z-[9999] flex items-center justify-center">
      <div
        className={`mt-3 flex items-center gap-3 rounded-xl border border-stone-200/60 bg-white/90 px-5 py-2.5 text-[12px] text-stone-600 shadow-[0_4px_20px_rgba(0,0,0,0.06)] backdrop-blur-xl transition-all duration-500 ${status === "done" ? "translate-y-[-8px] opacity-0" : "translate-y-0 opacity-100"} `}
      >
        {status === "migrating" && (
          <>
            <div className="border-accent/30 border-t-accent h-3.5 w-3.5 animate-spin rounded-full border-2" />
            <span>{progress || "正在同步本地数据..."}</span>
          </>
        )}
        {status === "done" && (
          <>
            <div className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-green-400">
              <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
                <path
                  d="M2 6l3 3 5-5"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span>数据同步完成 ✓</span>
          </>
        )}
      </div>
    </div>
  );
}
