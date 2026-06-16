"use client";

import Link from "next/link";
import { Play, Music2 } from "lucide-react";
import type { Channel } from "@/types";

interface ChannelCardProps {
  channel: Channel;
}

export function ChannelCard({ channel }: ChannelCardProps) {
  return (
    <Link
      href={`/channel/${channel.id}`}
      className="bg-surface/70 border-border/40 hover:border-accent/40 hover:shadow-accent/5 group block overflow-hidden rounded-xl border backdrop-blur-md transition-all duration-300 hover:shadow-lg"
    >
      {/* 封面图 */}
      <div className="bg-elevated relative aspect-square overflow-hidden">
        {channel.coverUrl ? (
          <img
            src={channel.coverUrl}
            alt={channel.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="from-elevated to-background flex h-full w-full items-center justify-center bg-gradient-to-br">
            <Music2 size={36} className="text-warm-muted/30" strokeWidth={1} />
          </div>
        )}
        {/* 暗角渐变 */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        {/* 播放按钮浮现 */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="bg-accent shadow-accent/30 flex h-12 w-12 scale-90 transform items-center justify-center rounded-full shadow-lg transition-transform duration-300 group-hover:scale-100">
            <Play size={20} fill="white" className="ml-0.5 text-white" />
          </div>
        </div>
      </div>

      {/* 信息 */}
      <div className="p-4">
        <h3 className="text-text-primary group-hover:text-accent truncate text-[13px] font-medium transition-colors duration-300">
          {channel.name}
        </h3>
        <p className="text-text-secondary mt-1 truncate text-[12px]">
          {channel.description || "暂无描述"}
        </p>
        <div className="mt-3 flex items-center gap-2">
          <span className="bg-accent/10 text-accent rounded-md px-2 py-0.5 text-[10px] font-medium">
            {channel.category}
          </span>
          <span className="text-warm-muted/60 text-[10px]">{channel.songIds.length} 首</span>
        </div>
      </div>
    </Link>
  );
}
