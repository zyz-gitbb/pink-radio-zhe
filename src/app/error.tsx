"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { Music, RefreshCw, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 日志上报逻辑可放置于此
    console.error("页面发生错误:", error);
  }, [error]);

  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-accent/10 relative w-full max-w-md overflow-hidden rounded-3xl border bg-white/80 p-8 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl"
      >
        {/* 背景装饰 */}
        <div className="from-accent/20 pointer-events-none absolute top-0 right-0 h-32 w-32 rounded-bl-full bg-gradient-to-br to-transparent opacity-50" />

        <div className="mx-auto mb-6 flex h-16 w-16 rotate-3 items-center justify-center rounded-2xl bg-red-50">
          <AlertCircle className="h-8 w-8 text-red-400" />
        </div>

        <h2 className="mb-3 text-2xl font-bold text-stone-800">哎呀，播放磁带卡住了</h2>

        <p className="mb-8 text-sm leading-relaxed text-stone-500">
          电台遇到了一些小故障：{error.message || "未知错误"}。<br />
          您可以尝试重新加载，或者返回首页。
        </p>

        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <button
            onClick={() => reset()}
            className="bg-accent hover:bg-accent/90 shadow-accent/20 flex items-center justify-center gap-2 rounded-xl px-6 py-3 font-medium text-white shadow-sm transition-all active:scale-95"
          >
            <RefreshCw className="h-4 w-4" />
            <span>重新加载</span>
          </button>

          <Link
            href="/"
            className="flex items-center justify-center gap-2 rounded-xl bg-stone-100 px-6 py-3 font-medium text-stone-600 transition-all hover:bg-stone-200 active:scale-95"
          >
            <Music className="h-4 w-4" />
            <span>返回电台首页</span>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
