"use client";

import { motion } from "framer-motion";
import { Search, Music } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="border-accent/10 w-full max-w-md rounded-3xl border bg-white/80 p-8 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl"
      >
        <div className="bg-accent/10 mx-auto mb-6 flex h-16 w-16 -rotate-3 items-center justify-center rounded-2xl">
          <Search className="text-accent h-8 w-8" />
        </div>

        <h2 className="mb-3 text-2xl font-bold text-stone-800">找不到该波段</h2>

        <p className="mb-8 text-sm leading-relaxed text-stone-500">
          抱歉，您访问的页面或频道似乎不存在 (404)。
          <br />
          可能是一个失效的链接，或者已被移除。
        </p>

        <div className="flex justify-center">
          <Link
            href="/"
            className="bg-accent hover:bg-accent/90 shadow-accent/20 flex items-center justify-center gap-2 rounded-xl px-6 py-3 font-medium text-white shadow-sm transition-all active:scale-95"
          >
            <Music className="h-4 w-4" />
            <span>返回电台首页</span>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
