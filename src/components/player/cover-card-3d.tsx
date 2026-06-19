"use client";

import { useState, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

export const CoverCard3D = function CoverCard3D({
  src,
  alt,
  onClick,
}: {
  src: string;
  alt: string;
  onClick?: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  const springConfig = { stiffness: 300, damping: 30 };
  const rotateX = useSpring(useTransform(mouseY, [0, 1], [10, -10]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [0, 1], [-10, 10]), springConfig);
  const glareX = useSpring(useTransform(mouseX, [0, 1], [-50, 50]), springConfig);
  const glareY = useSpring(useTransform(mouseY, [0, 1], [-50, 50]), springConfig);

  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width);
    mouseY.set((e.clientY - rect.top) / rect.height);
  };

  const handleMouseLeave = () => {
    mouseX.set(0.5);
    mouseY.set(0.5);
    setIsHovered(false);
  };

  return (
    <div style={{ perspective: 1200 }}>
      <motion.div
        ref={ref}
        className="relative h-64 w-64 cursor-pointer overflow-hidden rounded-2xl"
        style={{
          transformStyle: "preserve-3d",
          rotateX,
          rotateY,
        }}
        whileHover={{
          scale: 1.02,
          y: -5,
          boxShadow: "0px 25px 50px rgba(0,0,0,0.2)",
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onClick={onClick}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
      >
        <img
          src={src}
          alt={alt}
          className="h-64 w-64 rounded-2xl object-cover ring-1 ring-black/5"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/default-cover.svg";
          }}
        />
        {/* 动态光斑层 */}
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-2xl"
          style={{
            background:
              "radial-gradient(ellipse_at_center, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 70%)",
            x: glareX,
            y: glareY,
            opacity: isHovered ? 1 : 0,
          }}
          transition={{ opacity: { duration: 0.3 } }}
        />
      </motion.div>
    </div>
  );
};
