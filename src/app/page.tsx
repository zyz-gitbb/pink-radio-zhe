"use client";

import { useState, useEffect } from "react";
import { getChannels, onChannelsChanged, getCategories, onCategoriesChanged } from "@/lib/storage";
import { ChannelCard } from "@/components/channel-card";
import { TagManager } from "@/components/tag-manager";
import { Plus, Headphones, Radio, Sparkles, Settings } from "lucide-react";
import Link from "next/link";
import type { Channel } from "@/types";

export default function Home() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [tagManagerOpen, setTagManagerOpen] = useState(false);

  useEffect(() => {
    setChannels(getChannels());
    setCategories(getCategories());
  }, []);

  useEffect(() => {
    const unsubChannels = onChannelsChanged(() => {
      setChannels(getChannels());
    });
    const unsubCategories = onCategoriesChanged(() => {
      setCategories(getCategories());
    });
    return () => {
      unsubChannels();
      unsubCategories();
    };
  }, []);

  const filteredChannels = selectedCategory
    ? channels.filter((channel) => channel.category === selectedCategory)
    : channels;

  return (
    <div className="min-h-screen">
      {/* Hero 横幅 — 全宽通栏 */}
      <section className="relative w-full overflow-hidden">
        {/* 背景纹理层 */}
        <div className="absolute inset-0 bg-gradient-to-br from-accent/8 via-background to-elevated" />
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, rgba(0,0,0,0.15) 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
        />

        <div className="relative px-12 pt-14 pb-12">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-accent/15 flex items-center justify-center">
                <Sparkles size={14} className="text-accent" />
              </div>
              <span className="text-[11px] font-medium text-accent tracking-wide uppercase">
                Personal Radio
              </span>
            </div>
            <h1 className="text-4xl font-bold text-text-primary tracking-tight leading-tight">
              你的私人音乐电台
            </h1>
            <p className="text-base text-text-secondary mt-3 leading-relaxed max-w-xl">
              策展你喜爱的频道，随时随地沉浸在专属的音乐氛围中。
            </p>
            <div className="flex items-center gap-3 mt-6">
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent text-white text-[13px] font-medium rounded-lg hover:bg-accent-dim transition-colors shadow-md shadow-accent/20"
              >
                <Plus size={15} />
                新建频道
              </Link>
              <Link
                href="/radio"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-surface border border-border/60 text-text-primary text-[13px] font-medium rounded-lg hover:border-accent/30 hover:bg-accent/5 transition-all"
              >
                <Radio size={15} />
                个性化电台
              </Link>
            </div>
          </div>

          {/* 装饰性统计 */}
          <div className="flex items-center gap-8 mt-10 pt-6 border-t border-border/40">
            <div className="flex items-center gap-2.5">
              <Headphones size={16} className="text-accent/60" />
              <div>
                <p className="text-lg font-semibold text-text-primary">{channels.length}</p>
                <p className="text-[11px] text-text-secondary/60">个频道</p>
              </div>
            </div>
            <div className="w-px h-8 bg-border/40" />
            <div className="flex items-center gap-2.5">
              <Radio size={16} className="text-accent/60" />
              <div>
                <p className="text-lg font-semibold text-text-primary">
                  {channels.reduce((sum, c) => sum + c.songIds.length, 0)}
                </p>
                <p className="text-[11px] text-text-secondary/60">首歌曲</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 频道列表 — 全宽通栏 */}
      <section className="w-full px-12 py-10">
        {/* 分类筛选 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-semibold text-text-primary tracking-tight">
              策展频道
            </h2>
            <p className="text-[13px] text-text-secondary mt-0.5">
              你的私人音乐收藏
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
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
                className={`px-4 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
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
              className="ml-1 w-7 h-7 rounded-lg flex items-center justify-center text-text-secondary/40 hover:text-accent hover:bg-accent/8 transition-all"
              title="管理标签"
            >
              <Settings size={14} />
            </button>
          </div>
        </div>

        {/* 频道卡片网格 */}
        {filteredChannels.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredChannels.map((channel) => (
              <ChannelCard key={channel.id} channel={channel} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-surface border border-border/30 flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-warm-muted/40">
                <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
              </svg>
            </div>
            <p className="text-text-secondary/60 text-[13px]">暂无频道</p>
            <p className="text-text-secondary/40 text-[12px] mt-1">
              前往管理后台创建频道
            </p>
          </div>
        )}
      </section>

      <TagManager open={tagManagerOpen} onClose={() => setTagManagerOpen(false)} />
    </div>
  );
}
