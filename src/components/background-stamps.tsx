"use client";

import { motion } from "framer-motion";

export function BackgroundStamps() {
  return (
    <div className="fixed inset-0 z-10 pointer-events-none overflow-hidden">
      {/* 左下角：melody-corner（避开侧边栏 + 播放条） */}
      <motion.img
        src="/melody-corner.png"
        alt=""
        className="absolute bottom-24 left-72 w-48 h-auto mix-blend-multiply opacity-[0.25]"
        animate={{ y: [0, -5, 0], opacity: [0.25, 0.35, 0.25] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* 右上角：flower-corner */}
      <motion.img
        src="/flower-corner.png"
        alt=""
        className="absolute top-12 right-8 w-44 h-auto mix-blend-multiply opacity-[0.25]"
        animate={{ y: [0, 4, 0], opacity: [0.2, 0.3, 0.2] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />

      {/* 底部中央：sanrio-border（避开播放条） */}
      <motion.img
        src="/sanrio-border.png"
        alt=""
        className="absolute bottom-24 left-1/2 -translate-x-1/2 w-[600px] max-w-[90vw] h-auto mix-blend-multiply opacity-[0.2]"
        animate={{ y: [0, 3, 0], opacity: [0.2, 0.3, 0.2] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />
    </div>
  );
}
