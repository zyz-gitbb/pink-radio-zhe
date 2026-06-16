"use client";

import Link from "next/link";
import { Play, ListMusic } from "lucide-react";

interface RecommendationCardProps {
  id: number;
  name: string;
  picUrl: string;
  description?: string;
}

export function RecommendationCard({ id, name, picUrl, description }: RecommendationCardProps) {
  return (
    <Link href={`/playlist/${id}`}>
      <div className="bg-surface/70 border-border/40 hover:border-accent/40 hover:shadow-accent/5 group cursor-pointer overflow-hidden rounded-xl border backdrop-blur-md transition-all duration-300 hover:shadow-lg">
        {/* 封面图 */}
        <div className="bg-elevated relative aspect-square overflow-hidden">
          <img
            src={picUrl}
            alt={name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          {/* 播放按钮浮现 */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <div className="bg-accent shadow-accent/30 flex h-12 w-12 scale-90 transform items-center justify-center rounded-full shadow-lg transition-transform duration-300 group-hover:scale-100">
              <Play size={20} fill="white" className="ml-0.5 text-white" />
            </div>
          </div>
        </div>

        {/* 信息 */}
        <div className="p-4">
          <h3 className="group-hover:text-accent truncate text-[13px] font-medium text-stone-800 transition-colors duration-300">
            {name}
          </h3>
          {description ? (
            <p className="mt-1 line-clamp-2 text-[12px] text-stone-500">{description}</p>
          ) : (
            <div className="mt-1.5 flex items-center gap-1.5">
              <ListMusic size={11} className="text-stone-400/60" />
              <span className="text-[10px] text-stone-400/60">网易云推荐</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
