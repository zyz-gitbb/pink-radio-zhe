"use client";

import Link from "next/link";
import { Play, ListMusic } from "lucide-react";

interface RecommendationCardProps {
  id: number;
  name: string;
  picUrl: string;
  description?: string;
}

export function RecommendationCard({
  id,
  name,
  picUrl,
  description,
}: RecommendationCardProps) {
  return (
    <Link href={`/playlist/${id}`}>
      <div className="rounded-xl overflow-hidden bg-surface/70 backdrop-blur-md border border-border/40 hover:border-accent/40 hover:shadow-lg hover:shadow-accent/5 transition-all duration-300 group cursor-pointer">
        {/* 封面图 */}
        <div className="aspect-square relative overflow-hidden bg-elevated">
          <img
            src={picUrl}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          {/* 播放按钮浮现 */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center shadow-lg shadow-accent/30 transform scale-90 group-hover:scale-100 transition-transform duration-300">
              <Play size={20} fill="white" className="text-white ml-0.5" />
            </div>
          </div>
        </div>

        {/* 信息 */}
        <div className="p-4">
          <h3 className="font-medium text-stone-800 truncate text-[13px] group-hover:text-accent transition-colors duration-300">
            {name}
          </h3>
          {description ? (
            <p className="text-[12px] text-stone-500 mt-1 line-clamp-2">
              {description}
            </p>
          ) : (
            <div className="flex items-center gap-1.5 mt-1.5">
              <ListMusic size={11} className="text-stone-400/60" />
              <span className="text-[10px] text-stone-400/60">网易云推荐</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
