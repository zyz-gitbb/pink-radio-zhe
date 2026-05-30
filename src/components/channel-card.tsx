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
      className="block rounded-xl overflow-hidden bg-surface/70 backdrop-blur-md border border-border/40 hover:border-accent/40 hover:shadow-lg hover:shadow-accent/5 transition-all duration-300 group"
    >
      {/* 封面图 */}
      <div className="aspect-square relative overflow-hidden bg-elevated">
        {channel.coverUrl ? (
          <img
            src={channel.coverUrl}
            alt={channel.name}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-elevated to-background">
            <Music2 size={36} className="text-warm-muted/30" strokeWidth={1} />
          </div>
        )}
        {/* 暗角渐变 */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        {/* 播放按钮浮现 */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center shadow-lg shadow-accent/30 transform scale-90 group-hover:scale-100 transition-transform duration-300">
            <Play size={20} fill="white" className="text-white ml-0.5" />
          </div>
        </div>
      </div>

      {/* 信息 */}
      <div className="p-4">
        <h3 className="font-medium text-text-primary truncate text-[13px] group-hover:text-accent transition-colors duration-300">
          {channel.name}
        </h3>
        <p className="text-[12px] text-text-secondary mt-1 truncate">
          {channel.description || "暂无描述"}
        </p>
        <div className="flex items-center mt-3 gap-2">
          <span className="text-[10px] px-2 py-0.5 bg-accent/10 text-accent rounded-md font-medium">
            {channel.category}
          </span>
          <span className="text-[10px] text-warm-muted/60">
            {channel.songIds.length} 首
          </span>
        </div>
      </div>
    </Link>
  );
}
