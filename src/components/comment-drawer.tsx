"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Heart, MessageSquare } from "lucide-react";
import { getSongComments, type SongComment } from "@/lib/api";

interface CommentDrawerProps {
  open: boolean;
  onClose: () => void;
  songId: number | null;
  songName?: string;
}

const SPRING = { type: "spring" as const, damping: 25, stiffness: 200 };

function formatCount(n: number): string {
  if (n >= 10000) return (n / 10000).toFixed(1) + "万";
  return n.toString();
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function CommentItem({ comment }: { comment: SongComment }) {
  return (
    <div className="flex gap-3 py-4">
      <img
        src={comment.user.avatarUrl}
        alt={comment.user.nickname}
        className="ring-border/20 h-9 w-9 flex-shrink-0 rounded-full object-cover shadow-sm ring-1"
        onError={(e) => {
          (e.target as HTMLImageElement).src = "/default-avatar.svg";
        }}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <span className="truncate text-[12px] font-medium text-stone-700">
            {comment.user.nickname}
          </span>
          <div className="flex flex-shrink-0 items-center gap-1">
            <Heart size={11} className="text-stone-300" />
            <span className="text-[10px] text-stone-400 tabular-nums">
              {formatCount(comment.likedCount)}
            </span>
          </div>
        </div>
        <p className="mt-1.5 text-[13px] leading-relaxed break-words whitespace-pre-wrap text-stone-600">
          {comment.content}
        </p>
        <span className="mt-2 block text-[10px] text-stone-400/60">{formatTime(comment.time)}</span>
      </div>
    </div>
  );
}

function CommentSkeleton() {
  return (
    <div className="flex animate-pulse gap-3 py-4">
      <div className="bg-elevated h-9 w-9 flex-shrink-0 rounded-full" />
      <div className="flex-1 space-y-2">
        <div className="bg-elevated h-3 w-20 rounded" />
        <div className="bg-elevated h-3 w-full rounded" />
        <div className="bg-elevated h-3 w-3/4 rounded" />
      </div>
    </div>
  );
}

export function CommentDrawer({ open, onClose, songId, songName }: CommentDrawerProps) {
  const [hotComments, setHotComments] = useState<SongComment[]>([]);
  const [comments, setComments] = useState<SongComment[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !songId) {
      setHotComments([]);
      setComments([]);
      return;
    }
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const data = await getSongComments(songId);
      if (!cancelled) {
        setHotComments(data.hotComments);
        setComments(data.comments);
        setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [open, songId]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="border-border/30 fixed top-0 right-0 bottom-[72px] z-[45] flex w-[400px] flex-col border-l bg-[#fdfaf8]/85 backdrop-blur-2xl"
          style={{ boxShadow: "-10px 0 40px rgba(61,46,46,0.06)" }}
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={SPRING}
        >
          {/* 头部 */}
          <div className="border-border/30 flex items-center justify-between border-b px-6 py-5">
            <div className="flex items-center gap-2">
              <MessageSquare size={15} className="text-accent" />
              <span className="text-[14px] font-semibold text-stone-800">评论</span>
              {!loading && (
                <span className="ml-1 text-[11px] text-stone-400">
                  {hotComments.length + comments.length}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-full text-stone-400 transition-all hover:bg-stone-200/60 hover:text-stone-700"
            >
              <X size={15} />
            </button>
          </div>

          {/* 歌曲名 */}
          {songName && (
            <div className="border-border/20 border-b px-6 py-3">
              <p className="truncate text-[12px] text-stone-500">{songName}</p>
            </div>
          )}

          {/* 评论列表 */}
          <div className="scrollbar-hide flex-1 overflow-y-auto overscroll-contain px-6">
            {loading ? (
              <div className="py-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <CommentSkeleton key={i} />
                ))}
              </div>
            ) : hotComments.length === 0 && comments.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <MessageSquare size={28} className="mb-3 text-stone-300" />
                <p className="text-[13px] text-stone-400">暂无评论</p>
                <p className="mt-1 text-[11px] text-stone-400/60">快来抢沙发吧~</p>
              </div>
            ) : (
              <>
                {/* 精彩评论 */}
                {hotComments.length > 0 && (
                  <div>
                    <p className="text-accent pt-4 pb-1 text-[11px] font-medium tracking-wide uppercase">
                      精彩评论
                    </p>
                    <div className="divide-border/20 divide-y">
                      {hotComments.map((c, i) => (
                        <CommentItem key={`hot-${i}`} comment={c} />
                      ))}
                    </div>
                  </div>
                )}

                {/* 最新评论 */}
                {comments.length > 0 && (
                  <div>
                    <p className="pt-4 pb-1 text-[11px] font-medium tracking-wide text-stone-500 uppercase">
                      最新评论
                    </p>
                    <div className="divide-border/20 divide-y">
                      {comments.map((c, i) => (
                        <CommentItem key={`new-${i}`} comment={c} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
