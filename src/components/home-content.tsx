"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChannelCard } from "@/components/channel-card";
import { TagManager } from "@/components/tag-manager";
import { Plus, Headphones, Radio, Sparkles, Settings } from "lucide-react";
import Link from "next/link";
import type { Channel } from "@/types";

interface HomeContentProps {
  channels: Channel[];
  categories: string[];
}

export function HomeContent({ channels, categories }: HomeContentProps) {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [tagManagerOpen, setTagManagerOpen] = useState(false);

  const filteredChannels = selectedCategory
    ? channels.filter((channel) => channel.category === selectedCategory)
    : channels;

  return (
    <div className="min-h-screen">
      {/* Hero 横幅 — 全宽通栏 */}
      <section className="relative w-full overflow-hidden">
        {/* 背景纹理层 */}
        <div className="from-accent/8 via-background to-elevated absolute inset-0 bg-gradient-to-br" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(0,0,0,0.15) 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
        />

        <div className="relative px-12 pt-14 pb-12">
          <div className="max-w-3xl">
            <div className="mb-4 flex items-center gap-2">
              <div className="bg-accent/15 flex h-7 w-7 items-center justify-center rounded-lg">
                <Sparkles size={14} className="text-accent" />
              </div>
              <span className="text-accent text-[11px] font-medium tracking-wide uppercase">
                Personal Radio
              </span>
            </div>
            <h1 className="text-text-primary text-4xl leading-tight font-bold tracking-tight">
              你的私人音乐电台
            </h1>
            <p className="text-text-secondary mt-3 max-w-xl text-base leading-relaxed">
              策展你喜爱的频道，随时随地沉浸在专属的音乐氛围中。
            </p>
            <div className="mt-6 flex items-center gap-3">
              <Link
                href="/admin"
                className="bg-accent hover:bg-accent-dim shadow-accent/20 inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-[13px] font-medium text-white shadow-md transition-colors"
              >
                <Plus size={15} />
                新建频道
              </Link>
              <Link
                href="/radio"
                className="bg-surface border-border/60 text-text-primary hover:border-accent/30 hover:bg-accent/5 inline-flex items-center gap-2 rounded-lg border px-5 py-2.5 text-[13px] font-medium transition-all"
              >
                <Radio size={15} />
                个性化电台
              </Link>
            </div>
          </div>

          {/* 装饰性统计 */}
          <div className="border-border/40 mt-10 flex items-center gap-8 border-t pt-6">
            <div className="flex items-center gap-2.5">
              <Headphones size={16} className="text-accent/60" />
              <div>
                <p className="text-text-primary text-lg font-semibold">{channels.length}</p>
                <p className="text-text-secondary/60 text-[11px]">个频道</p>
              </div>
            </div>
            <div className="bg-border/40 h-8 w-px" />
            <div className="flex items-center gap-2.5">
              <Radio size={16} className="text-accent/60" />
              <div>
                <p className="text-text-primary text-lg font-semibold">
                  {channels.reduce((sum, c) => sum + c.songIds.length, 0)}
                </p>
                <p className="text-text-secondary/60 text-[11px]">首歌曲</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 频道列表 — 全宽通栏 */}
      <section className="w-full px-12 py-10">
        {/* 分类筛选 */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-text-primary text-xl font-semibold tracking-tight">策展频道</h2>
            <p className="text-text-secondary mt-0.5 text-[13px]">你的私人音乐收藏</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`rounded-lg px-4 py-1.5 text-[12px] font-medium transition-all ${
                selectedCategory === null
                  ? "bg-accent/15 text-accent"
                  : "text-text-secondary hover:text-text-primary hover:bg-accent/5"
              }`}
            >
              全部
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`rounded-lg px-4 py-1.5 text-[12px] font-medium transition-all ${
                  selectedCategory === category
                    ? "bg-accent/15 text-accent"
                    : "text-text-secondary hover:text-text-primary hover:bg-accent/5"
                }`}
              >
                {category}
              </button>
            ))}
            <button
              onClick={() => setTagManagerOpen(true)}
              className="text-text-secondary/40 hover:text-accent hover:bg-accent/8 ml-1 flex h-7 w-7 items-center justify-center rounded-lg transition-all"
              title="管理标签"
            >
              <Settings size={14} />
            </button>
          </div>
        </div>

        {/* 频道卡片网格 */}
        {filteredChannels.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredChannels.map((channel) => (
              <ChannelCard key={channel.id} channel={channel} />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center">
            <div className="bg-surface border-border/30 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-warm-muted/40"
              >
                <path d="M9 18V5l12-2v13" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="16" r="3" />
              </svg>
            </div>
            <p className="text-text-secondary/60 text-[13px]">暂无频道</p>
            <p className="text-text-secondary/40 mt-1 text-[12px]">前往管理后台创建频道</p>
          </div>
        )}
      </section>

      <TagManager
        open={tagManagerOpen}
        onClose={() => setTagManagerOpen(false)}
        categories={categories}
        onMutate={() => router.refresh()}
      />
    </div>
  );
}
