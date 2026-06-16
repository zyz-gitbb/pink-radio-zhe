"use client";

import { motion } from "framer-motion";

interface AmbientBackgroundProps {
  coverUrl: string;
}

export function AmbientBackground({ coverUrl }: AmbientBackgroundProps) {
  return (
    <div key={coverUrl} className="absolute inset-0 z-0 overflow-hidden bg-[#fdfaf8]">
      {/* 色块 A — 左上角，极致柔和的色彩氛围 */}
      <motion.div
        className="pointer-events-none absolute -top-[20%] -left-[10%] h-[80vw] w-[80vw] rounded-full"
        style={{
          backgroundImage: `url(${coverUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(140px)",
          opacity: 0.55,
          transform: "scale(1.5)",
        }}
        animate={{
          x: ["0vw", "10vw", "-5vw", "0vw"],
          y: ["0vh", "5vh", "-10vh", "0vh"],
          scale: [1.5, 1.6, 1.5],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* 色块 B — 右下角，反向微光呼吸 */}
      <motion.div
        className="pointer-events-none absolute -right-[10%] -bottom-[20%] h-[80vw] w-[80vw] rounded-full"
        style={{
          backgroundImage: `url(${coverUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(140px)",
          opacity: 0.55,
          transform: "scale(1.5)",
        }}
        animate={{
          x: ["0vw", "-8vw", "6vw", "0vw"],
          y: ["0vh", "-10vh", "5vh", "0vh"],
          scale: [1.5, 1.4, 1.5],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* 高级粉奶油护眼层 — 压制高亮色彩，确保歌词高对比度 */}
      <div className="pointer-events-none absolute inset-0 bg-[#fdfaf8]/65" />
    </div>
  );
}
