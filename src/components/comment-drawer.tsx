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
        className="w-9 h-9 rounded-full ring-1 ring-border/20 shadow-sm flex-shrink-0 object-cover"
        onError={(e) => { (e.target as HTMLImageElement).src = "/default-avatar.svg"; }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <span className="text-[12px] font-medium text-stone-700 truncate">
            {comment.user.nickname}
          </span>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Heart size={11} className="text-stone-300" />
            <span className="text-[10px] text-stone-400 tabular-nums">
              {formatCount(comment.likedCount)}
            </span>
          </div>
        </div>
        <p className="text-[13px] text-stone-600 leading-relaxed mt-1.5 whitespace-pre-wrap break-words">
          {comment.content}
        </p>
        <span className="text-[10px] text-stone-400/60 mt-2 block">
          {formatTime(comment.time)}
        </span>
      </div>
    </div>
  );
}

function CommentSkeleton() {
  return (
    <div className="flex gap-3 py-4 animate-pulse">
      <div className="w-9 h-9 rounded-full bg-elevated flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-elevated rounded w-20" />
        <div className="h-3 bg-elevated rounded w-full" />
        <div className="h-3 bg-elevated rounded w-3/4" />
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
    return () => { cancelled = true; };
  }, [open, songId]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed top-0 right-0 bottom-[72px] z-[45] w-[400px] flex flex-col bg-[#fdfaf8]/85 backdrop-blur-2xl border-l border-border/30"
          style={{ boxShadow: "-10px 0 40px rgba(61,46,46,0.06)" }}
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={SPRING}
        >
          {/* 头部 */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-border/30">
            <div className="flex items-center gap-2">
              <MessageSquare size={15} className="text-accent" />
              <span className="text-[14px] font-semibold text-stone-800">评论</span>
              {!loading && (
                <span className="text-[11px] text-stone-400 ml-1">
                  {hotComments.length + comments.length}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-all"
            >
              <X size={15} />
            </button>
          </div>

          {/* 歌曲名 */}
          {songName && (
            <div className="px-6 py-3 border-b border-border/20">
              <p className="text-[12px] text-stone-500 truncate">{songName}</p>
            </div>
          )}

          {/* 评论列表 */}
          <div className="flex-1 overflow-y-auto overscroll-contain scrollbar-hide px-6">
            {loading ? (
              <div className="py-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <CommentSkeleton key={i} />
                ))}
              </div>
            ) : hotComments.length === 0 && comments.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <MessageSquare size={28} className="text-stone-300 mb-3" />
                <p className="text-[13px] text-stone-400">暂无评论</p>
                <p className="text-[11px] text-stone-400/60 mt-1">快来抢沙发吧~</p>
              </div>
            ) : (
              <>
                {/* 精彩评论 */}
                {hotComments.length > 0 && (
                  <div>
                    <p className="text-[11px] font-medium text-accent tracking-wide uppercase pt-4 pb-1">
                      精彩评论
                    </p>
                    <div className="divide-y divide-border/20">
                      {hotComments.map((c, i) => (
                        <CommentItem key={`hot-${i}`} comment={c} />
                      ))}
                    </div>
                  </div>
                )}

                {/* 最新评论 */}
                {comments.length > 0 && (
                  <div>
                    <p className="text-[11px] font-medium text-stone-500 tracking-wide uppercase pt-4 pb-1">
                      最新评论
                    </p>
                    <div className="divide-y divide-border/20">
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
