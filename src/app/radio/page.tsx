"use client";

import { useState, useEffect } from "react";
import { getPersonalized } from "@/lib/api";
import { RecommendationCard } from "@/components/recommendation-card";
import { RefreshCw } from "lucide-react";
import type { PersonalizedResponse } from "@/types";

export default function RadioPage() {
  const [recommendations, setRecommendations] = useState<PersonalizedResponse>({
    result: [],
  });
  const [loading, setLoading] = useState(true);

  const fetchRecommendations = async () => {
    setLoading(true);
    const data = await getPersonalized();
    setRecommendations(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  return (
    <div className="px-12 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-stone-800 tracking-tight">
            个性化电台
          </h1>
          <p className="text-[13px] text-stone-500 mt-1">
            根据你的口味推荐
          </p>
        </div>
        <button
          onClick={fetchRecommendations}
          className="flex items-center gap-2 px-4 py-1.5 text-[13px] text-stone-500 hover:text-stone-800 bg-accent/5 rounded-lg hover:bg-accent/10 transition-all font-medium"
        >
          <RefreshCw size={13} />
          刷新推荐
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-stone-500 text-[13px]">加载中...</div>
        </div>
      ) : recommendations.result.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {recommendations.result.map((item) => (
            <RecommendationCard
              key={item.id}
              id={item.id}
              name={item.name}
              picUrl={item.picUrl}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-elevated border border-border/30 flex items-center justify-center mx-auto mb-4">
            <RefreshCw size={24} className="text-stone-400/40" />
          </div>
          <p className="text-stone-500/60 text-[13px]">暂无推荐</p>
          <p className="text-stone-400/50 text-[12px] mt-1">
            请检查 API 配置或稍后再试
          </p>
        </div>
      )}
    </div>
  );
}
