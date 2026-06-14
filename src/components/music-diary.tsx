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

export function MusicDiary({
  songId,
  songName,
  songArtistName,
  songCoverUrl,
}: MusicDiaryProps) {
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
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
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
    <div ref={wrapperRef} className="relative flex justify-center w-64 mt-5">
      {/* 胶囊触发按钮 */}
      <motion.button
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-full bg-rose-50/60 backdrop-blur-md border border-rose-100/50 shadow-[0_4px_12px_rgba(0,0,0,0.03)] text-xs tracking-widest text-stone-500 font-medium transition-all duration-300 hover:bg-rose-100/60 hover:text-stone-800 hover:shadow-[0_4px_12px_rgba(225,29,72,0.06)] hover:-translate-y-0.5"
      >
        <PenLine
          size={13}
          strokeWidth={1.5}
          className="text-stone-500"
        />
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
            className="absolute top-full mt-4 z-50 w-[280px] bg-[#fffdfc]/90 backdrop-blur-xl rounded-2xl border border-stone-200/40 shadow-[0_8px_32px_rgba(212,133,138,0.1)] overflow-hidden"
          >
            {/* 头部 */}
            <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
              <div className="flex items-center gap-1.5">
                <BookOpen size={12} className="text-stone-400" />
                <span className="text-[10px] font-medium text-stone-400 tracking-wide uppercase">
                  Music Diary
                </span>
                {entries.length > 0 && (
                  <span className="text-[9px] text-stone-300 ml-0.5">
                    ({entries.length})
                  </span>
                )}
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-5 h-5 rounded-md flex items-center justify-center text-stone-300 hover:text-stone-500 hover:bg-stone-100/60 transition-all"
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
                className="w-full bg-stone-50/50 text-[12px] text-stone-700 placeholder-stone-300 leading-relaxed resize-none outline-none focus:ring-1 focus:ring-rose-200/60 rounded-xl px-3 py-2 transition-shadow"
              />
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-[9px] text-stone-300 tabular-nums font-mono">
                  {draft.length}/500
                </span>
                <button
                  onClick={handleSave}
                  disabled={isPending || !draft.trim()}
                  className="px-3 py-1 bg-rose-50 text-rose-400 text-[10px] font-medium rounded-lg hover:bg-rose-100 transition-all disabled:opacity-40"
                >
                  {isPending ? "保存中..." : "存档"}
                </button>
              </div>
            </div>

            {/* 分割线 */}
            {entries.length > 0 && (
              <div className="h-px bg-stone-200/40 mx-4" />
            )}

            {/* 历史记录滚动列表 */}
            {entries.length > 0 && (
              <div className="max-h-[250px] overflow-y-auto scrollbar-hide px-4 py-2 space-y-2.5">
                {entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="group relative pb-2.5 border-b border-stone-100/60 last:border-b-0 last:pb-0"
                  >
                    <p className="text-[11.5px] text-stone-600 leading-relaxed whitespace-pre-wrap break-words pr-5">
                      {entry.content}
                    </p>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-[8.5px] text-stone-300 font-mono">
                        {entry.timestamp}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      disabled={isPending}
                      className="absolute top-0 right-0 w-5 h-5 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 text-stone-300 hover:text-red-400 transition-all disabled:opacity-40"
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
                <p className="text-[10px] text-stone-300 text-center">
                  还没有留下任何足迹
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
