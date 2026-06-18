import { RadioClient } from "./radio-client";
import {
  getDailyRecommendSongsServer,
  getRecommendationsServer,
  getRecommendationPoolServer,
} from "@/lib/server-api";

export default async function RadioPage() {
  // 并行获取初始化数据
  const [dailySongs, bentoData, initialPool] = await Promise.all([
    getDailyRecommendSongsServer(),
    getRecommendationsServer(),
    getRecommendationPoolServer(100),
  ]);

  // 1. 处理每日推荐封面
  const dailyCover =
    dailySongs.length > 0
      ? dailySongs[0]?.al?.picUrl || dailySongs[0]?.album?.picUrl || ""
      : "";

  // 2. 处理 Bento 卡片数据
  const items = bentoData.result || [];
  const radarItem = items.find((it: any) => /雷达/.test(it.name));
  const chineseItem = items.find((it: any) => /华语|日推/.test(it.name));
  const fallback1 = items[0];
  const fallback2 = items.length > 1 ? items[1] : items[0];
  const resolvedRadar = radarItem || fallback1 || null;
  const resolvedChinese = chineseItem || fallback2 || null;

  const initialBento = {
    dailyCover,
    radarCover: resolvedRadar?.picUrl || "",
    radarId: resolvedRadar?.id || null,
    chineseCover: resolvedChinese?.picUrl || "",
    chineseId: resolvedChinese?.id || null,
  };

  return <RadioClient initialBento={initialBento} initialPool={initialPool} />;
}
