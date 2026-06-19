"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { channels, channelSongs, diaries, categories } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import type { Channel } from "@/types";

// ==================== 频道管理 ====================

/**
 * 获取所有频道（聚合关联歌曲 ID 列表）
 * 返回值与原有 Channel 接口完全一致：tags 为 string[]，songIds 为 number[]
 */
export async function getChannels(): Promise<Channel[]> {
  const rows = await db.query.channels.findMany({
    with: { songs: true },
  });

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description ?? "",
    category: row.category ?? "其他",
    coverUrl: row.coverUrl ?? "",
    tags: parseTags(row.tags),
    songIds: row.songs.map((s) => s.songId),
    createdAt: toMillis(row.createdAt),
    updatedAt: toMillis(row.updatedAt),
  }));
}

/**
 * 获取单个频道
 */
export async function getChannelById(id: string): Promise<Channel | null> {
  const row = await db.query.channels.findFirst({
    where: eq(channels.id, id),
    with: { songs: true },
  });

  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    description: row.description ?? "",
    category: row.category ?? "其他",
    coverUrl: row.coverUrl ?? "",
    tags: parseTags(row.tags),
    songIds: row.songs.map((s) => s.songId),
    createdAt: toMillis(row.createdAt),
    updatedAt: toMillis(row.updatedAt),
  };
}

/**
 * 插入或更新频道（upsert）
 * 自动将 tags 数组序列化为 JSON 字符串
 */
export async function saveChannel(channelData: Omit<Channel, "songIds">): Promise<void> {
  sanitizeId(channelData.id, { label: '频道ID' });
  sanitizeString(channelData.name, { max: 60, allowEmpty: false });
  sanitizeString(channelData.description, { max: 500 });
  sanitizeString(channelData.category, { max: 40 });
  sanitizeString(channelData.coverUrl, { max: 1000 });

  const now = new Date();

  await db
    .insert(channels)
    .values({
      id: channelData.id,
      name: channelData.name,
      description: channelData.description ?? "",
      category: channelData.category ?? "其他",
      coverUrl: channelData.coverUrl ?? "",
      tags: JSON.stringify(channelData.tags ?? []),
      createdAt: new Date(channelData.createdAt || now),
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: channels.id,
      set: {
        name: channelData.name,
        description: channelData.description ?? "",
        category: channelData.category ?? "其他",
        coverUrl: channelData.coverUrl ?? "",
        tags: JSON.stringify(channelData.tags ?? []),
        updatedAt: now,
      },
    });

  revalidatePath("/");
  revalidatePath("/admin");
}

/**
 * 删除频道（级联删除自动清理 channel_songs 关联记录）
 */
export async function deleteChannel(id: string): Promise<void> {
  sanitizeId(id, { label: '频道ID' });
  await db.delete(channels).where(eq(channels.id, id));

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath(`/channel/${id}`);
}

// ==================== 分类标签管理 ====================

const DEFAULT_CATEGORIES = ["深夜放松", "工作专注", "运动节拍", "学习陪伴", "其他"];

/**
 * 获取所有分类（若表为空则自动写入默认分类）
 */
export async function getCategories(): Promise<string[]> {
  const rows = await db.select().from(categories).orderBy(categories.sortOrder).all();

  if (rows.length === 0) {
    // 首次访问：写入默认分类
    for (let i = 0; i < DEFAULT_CATEGORIES.length; i++) {
      await db.insert(categories).values({
        name: DEFAULT_CATEGORIES[i],
        sortOrder: i,
      });
    }
    return [...DEFAULT_CATEGORIES];
  }

  return rows.map((r) => r.name);
}

/**
 * 新增分类
 */
export async function addCategory(name: string): Promise<string[]> {
  const existing = await db.select().from(categories).all();

  if (!existing.some((c) => c.name === name)) {
    const maxOrder = existing.reduce((max, c) => Math.max(max, c.sortOrder ?? 0), 0);
    await db.insert(categories).values({ name, sortOrder: maxOrder + 1 });
  }

  revalidatePath("/");
  return getCategories();
}

/**
 * 重命名分类（同步更新引用该分类的频道）
 */
export async function renameCategory(oldName: string, newName: string): Promise<string[]> {
  await db.update(categories).set({ name: newName }).where(eq(categories.name, oldName));

  // 同步更新所有使用旧分类名的频道
  const affectedChannels = await db
    .select({ id: channels.id })
    .from(channels)
    .where(eq(channels.category, oldName))
    .all();

  for (const ch of affectedChannels) {
    await db
      .update(channels)
      .set({ category: newName, updatedAt: new Date() })
      .where(eq(channels.id, ch.id));
  }

  revalidatePath("/");
  revalidatePath("/admin");
  return getCategories();
}

/**
 * 删除分类
 */
export async function deleteCategory(name: string): Promise<string[]> {
  await db.delete(categories).where(eq(categories.name, name));
  revalidatePath("/");
  return getCategories();
}

/**
 * 获取指定分类下的频道数量（用于删除前检查）
 */
export async function getChannelCountByCategory(categoryName: string): Promise<number> {
  const rows = await db
    .select({ id: channels.id })
    .from(channels)
    .where(eq(channels.category, categoryName))
    .all();
  return rows.length;
}

// ==================== 歌曲管理 ====================

/**
 * 添加歌曲到频道
 * 先检查是否已存在该 songId，避免重复
 */
export async function addSongToChannel(
  channelId: string,
  song: {
    id: number;
    name: string;
    artistName?: string;
    coverUrl?: string;
  }
): Promise<{
  success: boolean;
  channelName?: string;
  reason?: "duplicate" | "not_found";
}> {
  // 检查频道是否存在
  const channel = await db.query.channels.findFirst({
    where: eq(channels.id, channelId),
  });

  if (!channel) {
    return { success: false, reason: "not_found" };
  }

  // 精确检查：该频道下是否已有该 songId
  const duplicate = await db
    .select({ id: channelSongs.id })
    .from(channelSongs)
    .where(and(eq(channelSongs.channelId, channelId), eq(channelSongs.songId, song.id)))
    .get();

  if (duplicate) {
    return { success: false, channelName: channel.name, reason: "duplicate" };
  }

  // 插入记录
  await db.insert(channelSongs).values({
    channelId,
    songId: song.id,
    songName: song.name ?? "",
    artistName: song.artistName ?? "",
    coverUrl: song.coverUrl ?? "",
    addedAt: new Date(),
  });

  revalidatePath("/");
  revalidatePath(`/channel/${channelId}`);
  return { success: true, channelName: channel.name };
}

/**
 * 从频道中移除歌曲
 */
export async function removeSongFromChannel(channelId: string, songId: number): Promise<boolean> {
  await db
    .delete(channelSongs)
    .where(and(eq(channelSongs.channelId, channelId), eq(channelSongs.songId, songId)));

  revalidatePath(`/channel/${channelId}`);
  return true;
}

// ==================== 音乐手账管理 ====================

export interface DiaryData {
  id: string;
  content: string;
  songId?: number;
  songName?: string;
  artistName?: string;
  coverUrl?: string;
  createdAt: number; // 毫秒时间戳
}

/**
 * 获取所有手账记录，按时间由新到旧排序
 */
export async function getDiaries(): Promise<DiaryData[]> {
  const rows = await db.select().from(diaries).orderBy(desc(diaries.createdAt)).all();

  return rows.map((row) => ({
    id: row.id,
    content: row.content,
    songId: row.songId ?? undefined,
    songName: row.songName ?? "",
    artistName: row.artistName ?? "",
    coverUrl: row.coverUrl ?? "",
    createdAt: toMillis(row.createdAt),
  }));
}

/**
 * 保存新手账记录
 */
export async function saveDiary(diaryData: {
  content: string;
  songId?: number;
  songName?: string;
  artistName?: string;
  coverUrl?: string;
}): Promise<DiaryData> {
  sanitizeString(diaryData.content, { max: 500, allowEmpty: false });
  sanitizeString(diaryData.songName, { max: 120 });
  sanitizeString(diaryData.artistName, { max: 120 });
  sanitizeString(diaryData.coverUrl, { max: 1000 });

  const id = generateId();
  const now = new Date();

  await db.insert(diaries).values({
    id,
    content: diaryData.content,
    songId: diaryData.songId ?? null,
    songName: diaryData.songName ?? "",
    artistName: diaryData.artistName ?? "",
    coverUrl: diaryData.coverUrl ?? "",
    createdAt: now,
  });

  revalidatePath("/diary");

  return {
    id,
    content: diaryData.content,
    songId: diaryData.songId,
    songName: diaryData.songName ?? "",
    artistName: diaryData.artistName ?? "",
    coverUrl: diaryData.coverUrl ?? "",
    createdAt: now.getTime(),
  };
}

/**
 * 删除单条手账
 */
export async function deleteDiary(id: string): Promise<void> {
  sanitizeId(id, { label: '手账ID' });
  await db.delete(diaries).where(eq(diaries.id, id));
  revalidatePath("/diary");
}

/**
 * 编辑手账内容
 */
export async function updateDiary(id: string, content: string): Promise<{ id: string; content: string }> {
  sanitizeId(id, { label: '手账ID' });
  const trimmed = sanitizeString(content, { max: 500, allowEmpty: false })!;
  await db.update(diaries).set({ content: trimmed }).where(eq(diaries.id, id));
  revalidatePath("/diary");
  return { id, content: trimmed };
}

/**
 * 修复手账记录中缺失的歌曲元数据
 * 查找 songName 为空/含"未知"/缺少封面的记录，从网易云 API 补充真实信息
 */
export async function repairDiaryMetadata(): Promise<{
  repaired: number;
  failed: number;
}> {
  // 1. 查询所有手账
  const allRows = await db.select().from(diaries).all();
  console.log(`[repairDiaryMetadata] 共 ${allRows.length} 条手账记录`);

  // 2. 过滤需要修复的记录：有 songId 但 songName/coverUrl 不完整
  const needsRepair = allRows.filter((row) => {
    if (!row.songId) return false;
    const name = row.songName ?? "";
    const cover = row.coverUrl ?? "";
    return name === "" || name.includes("未知") || cover === "" || cover === "/default-cover.svg";
  });

  console.log(`[repairDiaryMetadata] 需要修复 ${needsRepair.length} 条`);
  if (needsRepair.length === 0) {
    return { repaired: 0, failed: 0 };
  }

  // 3. 提取去重的 songId
  const uniqueSongIds = [...new Set(needsRepair.map((r) => r.songId!))];
  console.log(`[repairDiaryMetadata] 涉及 ${uniqueSongIds.length} 个不同歌曲:`, uniqueSongIds);

  // 4. 批量调用网易云 API 获取歌曲详情
  const NETEASE_API_BASE = process.env.NETEASE_API_BASE_URL || "http://localhost:4000";
  const songMap = new Map<number, { name: string; artistName: string; coverUrl: string }>();

  const BATCH_SIZE = 100;
  for (let i = 0; i < uniqueSongIds.length; i += BATCH_SIZE) {
    const batch = uniqueSongIds.slice(i, i + BATCH_SIZE);
    const url = `${NETEASE_API_BASE}/song/detail?ids=${batch.join(",")}`;
    console.log(`[repairDiaryMetadata] 请求 API: ${url}`);

    try {
      const res = await fetch(url, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        const songs: any[] = data.songs || [];
        console.log(`[repairDiaryMetadata] API 返回 ${songs.length} 首歌曲详情`);

        for (const s of songs) {
          const artistName =
            (s.ar || s.artists || []).map((a: any) => a.name).join(", ") || "未知艺术家";
          const coverUrl = s.al?.picUrl || s.album?.picUrl || "";
          songMap.set(s.id, {
            name: s.name || "未知歌曲",
            artistName,
            coverUrl,
          });
          console.log(
            `[repairDiaryMetadata] 歌曲 ${s.id}: name="${s.name}", artist="${artistName}", cover="${coverUrl.slice(0, 60)}..."`
          );
        }
      } else {
        console.error(`[repairDiaryMetadata] API 响应异常: ${res.status}`);
      }
    } catch (err) {
      console.error(`[repairDiaryMetadata] API 请求失败:`, err);
    }
  }

  // 5. 遍历需要修复的记录，逐条更新
  let repaired = 0;
  let failed = 0;

  for (const row of needsRepair) {
    const info = songMap.get(row.songId!);
    if (info) {
      console.log(
        `[repairDiaryMetadata] 更新手账 ${row.id}: songName="${info.name}", artist="${info.artistName}", cover="${info.coverUrl.slice(0, 60)}..."`
      );
      await db
        .update(diaries)
        .set({
          songName: info.name,
          artistName: info.artistName,
          coverUrl: info.coverUrl,
        })
        .where(eq(diaries.id, row.id));
      repaired++;
    } else {
      console.warn(`[repairDiaryMetadata] 手账 ${row.id} (songId=${row.songId}) 未找到 API 数据`);
      failed++;
    }
  }

  console.log(`[repairDiaryMetadata] 完成: 修复 ${repaired} 条, 失败 ${failed} 条`);

  revalidatePath("/diary");
  revalidatePath("/", "layout");
  return { repaired, failed };
}


function sanitizeString(v: unknown, { max = 500, allowEmpty = true }: { max?: number; allowEmpty?: boolean } = {}) {
  if (v === undefined || v === null) return allowEmpty ? '' : undefined
  const s = String(v).trim()
  if (!allowEmpty && s.length === 0) throw new Error('输入不能为空')
  if (s.length > max) throw new Error('内容过长')
  return s
}

function sanitizeId(v: unknown, { label = 'id' }: { label?: string } = {}) {
  const s = String(v ?? '').trim()
  if (s.length === 0 || s.length > 128) throw new Error(label + ' 格式不合法')
  return s
}

// ==================== 工具函数 ====================

/** 将 JSON 字符串解析为 string[]，容错返回空数组 */
function parseTags(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** 将 Date 或 number 统一转为毫秒时间戳 */
function toMillis(value: Date | number): number {
  if (value instanceof Date) return value.getTime();
  return value;
}

/** 生成短 ID（UUID 风格） */
function generateId(): string {
  return (
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 7) +
    Math.random().toString(36).slice(2, 5)
  );
}
