import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

/**
 * 频道表
 * 对应原 Channel 接口，替代 localStorage 中的 radio_channels
 */
export const channels = sqliteTable("channels", {
  id: text("id").primaryKey(), // UUID
  name: text("name").notNull(),
  description: text("description").default(""),
  category: text("category").default("其他"),
  coverUrl: text("cover_url").default(""),
  tags: text("tags").default("[]"), // JSON 数组字符串，如 '["流行","摇滚"]'
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

/**
 * 频道-歌曲关联表
 * 替代原 Channel.songIds: number[] 数组
 * songId 为网易云歌曲 ID，songName/artistName/coverUrl 为冗余缓存字段
 */
export const channelSongs = sqliteTable("channel_songs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  channelId: text("channel_id")
    .notNull()
    .references(() => channels.id, { onDelete: "cascade" }),
  songId: integer("song_id").notNull(),
  songName: text("song_name").default(""),
  artistName: text("artist_name").default(""),
  coverUrl: text("cover_url").default(""),
  addedAt: integer("added_at", { mode: "timestamp" }).notNull(),
});

/**
 * 分类标签表
 * 替代原 localStorage 中的 radio_category_tags
 */
export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  sortOrder: integer("sort_order").default(0),
});

/**
 * 音乐手账表
 * 替代原 localStorage 中 music_diary_{songId} 的按歌曲分 key 存储
 */
export const diaries = sqliteTable("diaries", {
  id: text("id").primaryKey(), // UUID
  content: text("content").notNull(),
  songId: integer("song_id"), // 可为空（通用日记）
  songName: text("song_name").default(""),
  artistName: text("artist_name").default(""),
  coverUrl: text("cover_url").default(""),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// ==================== Relations ====================

/**
 * channels ↔ channelSongs 一对多关系
 * 用于 db.query.channels.findMany({ with: { songs: true } })
 */
export const channelsRelations = relations(channels, ({ many }) => ({
  songs: many(channelSongs),
}));

/**
 * channelSongs → channels 多对一关系
 */
export const channelSongsRelations = relations(channelSongs, ({ one }) => ({
  channel: one(channels, {
    fields: [channelSongs.channelId],
    references: [channels.id],
  }),
}));
