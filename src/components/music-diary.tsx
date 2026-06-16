"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PenLine, X, Trash2, BookOpen } from "lucide-react";
import { getDiaries, saveDiary, deleteDiary } from "@/app/actions";
import { showToast } from "@/components/Toast";

interface MusicDiaryProps {
  songId: number | null | undefined;
  songName?: string;
  songArtistName?: string;
  songCoverUrl?: string;
}

interface DiaryEntry {
  id: string;
  content: string;
  timestamp: string;
}

export function MusicDiary({ songId, songName, songArtistName, songCoverUrl }: MusicDiaryProps) {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [isPending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // 加载当前歌曲的手账
  useEffect(() => {
    setLoaded(false);
    if (songId == null) {
      setEntries([]);
      setLoaded(true);
      return;
    }
    getDiaries()
      .then((all) => {
        const filtered = all
          .filter((d) => d.songId === songId)
          .map((d) => {
            const date = new Date(d.createdAt);
            const pad = (n: number) => String(n).padStart(2, "0");
            return {
              id: d.id,
              content: d.content,
              timestamp: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`,
            };
          });
        setEntries(filtered);
      })
      .finally(() => setLoaded(true));
  }, [songId]);

  // 切歌时收起面板、清空草稿
  useEffect(() => {
    setIsOpen(false);
    setDraft("");
  }, [songId]);

  // 展开后聚焦输入框
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  // 点击外部关闭面板
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleSave = () => {
    if (!draft.trim()) {
      showToast("写点什么再保存吧~");
      return;
    }
    if (songId == null) return;

    startTransition(async () => {
      const saved = await saveDiary({
        content: draft.trim(),
        songId,
        songName: songName || "",
        artistName: songArtistName || "",
        coverUrl: songCoverUrl || "",
      });
      const date = new Date(saved.createdAt);
      const pad = (n: number) => String(n).padStart(2, "0");
      const timestamp = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
      setEntries((prev) => [{ id: saved.id, content: saved.content, timestamp }, ...prev]);
      setDraft("");
      showToast("已存入手账 ✨");
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      await deleteDiary(id);
      setEntries((prev) => prev.filter((e) => e.id !== id));
      showToast("已擦除一条记录");
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
  };

  if (!loaded) return null;

  return (
    <div ref={wrapperRef} className="relative mt-5 flex w-64 justify-center">
      {/* 胶囊触发按钮 */}
      <motion.button
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-center gap-2 rounded-full border border-rose-100/50 bg-rose-50/60 px-5 py-2 text-xs font-medium tracking-widest text-stone-500 shadow-[0_4px_12px_rgba(0,0,0,0.03)] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-rose-100/60 hover:text-stone-800 hover:shadow-[0_4px_12px_rgba(225,29,72,0.06)]"
      >
        <PenLine size={13} strokeWidth={1.5} className="text-stone-500" />
        <span>撰写手账</span>
      </motion.button>

      {/* 展开面板 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: -10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="absolute top-full z-50 mt-4 w-[280px] overflow-hidden rounded-2xl border border-stone-200/40 bg-[#fffdfc]/90 shadow-[0_8px_32px_rgba(212,133,138,0.1)] backdrop-blur-xl"
          >
            {/* 头部 */}
            <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
              <div className="flex items-center gap-1.5">
                <BookOpen size={12} className="text-stone-400" />
                <span className="text-[10px] font-medium tracking-wide text-stone-400 uppercase">
                  Music Diary
                </span>
                {entries.length > 0 && (
                  <span className="ml-0.5 text-[9px] text-stone-300">({entries.length})</span>
                )}
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="flex h-5 w-5 items-center justify-center rounded-md text-stone-300 transition-all hover:bg-stone-100/60 hover:text-stone-500"
              >
                <X size={12} />
              </button>
            </div>

            {/* 输入区 */}
            <div className="px-4 pb-3">
              <textarea
                ref={textareaRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="这一刻在什么？写下你的听歌日记吧..."
                rows={3}
                maxLength={500}
                className="w-full resize-none rounded-xl bg-stone-50/50 px-3 py-2 text-[12px] leading-relaxed text-stone-700 placeholder-stone-300 transition-shadow outline-none focus:ring-1 focus:ring-rose-200/60"
              />
              <div className="mt-1.5 flex items-center justify-between">
                <span className="font-mono text-[9px] text-stone-300 tabular-nums">
                  {draft.length}/500
                </span>
                <button
                  onClick={handleSave}
                  disabled={isPending || !draft.trim()}
                  className="rounded-lg bg-rose-50 px-3 py-1 text-[10px] font-medium text-rose-400 transition-all hover:bg-rose-100 disabled:opacity-40"
                >
                  {isPending ? "保存中..." : "存档"}
                </button>
              </div>
            </div>

            {/* 分割线 */}
            {entries.length > 0 && <div className="mx-4 h-px bg-stone-200/40" />}

            {/* 历史记录滚动列表 */}
            {entries.length > 0 && (
              <div className="scrollbar-hide max-h-[250px] space-y-2.5 overflow-y-auto px-4 py-2">
                {entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="group relative border-b border-stone-100/60 pb-2.5 last:border-b-0 last:pb-0"
                  >
                    <p className="pr-5 text-[11.5px] leading-relaxed break-words whitespace-pre-wrap text-stone-600">
                      {entry.content}
                    </p>
                    <div className="mt-1.5 flex items-center justify-between">
                      <span className="font-mono text-[8.5px] text-stone-300">
                        {entry.timestamp}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      disabled={isPending}
                      className="absolute top-0 right-0 flex h-5 w-5 items-center justify-center rounded text-stone-300 opacity-0 transition-all group-hover:opacity-100 hover:text-red-400 disabled:opacity-40"
                      title="删除"
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* 空状态提示 */}
            {entries.length === 0 && (
              <div className="px-4 pb-3.5">
                <p className="text-center text-[10px] text-stone-300">还没有留下任何足迹</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
