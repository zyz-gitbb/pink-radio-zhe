import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

const sqlite = new Database("data.db");

// WAL 模式：允许多读单写，提升并发读取性能
sqlite.pragma("journal_mode = WAL");

// 开启外键约束，确保 ON DELETE CASCADE 生效
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });
