"use client";

import useSWR from "swr";
import { getChannels } from "@/app/actions";
import type { Channel } from "@/types";

/**
 * 共享频道列表 hook（SWR 缓存）
 * sidebar、channel-picker 等组件统一使用，避免重复请求
 */
export function useChannels() {
  const { data, error, isLoading, mutate } = useSWR<Channel[]>(
    "channels",
    () => getChannels(),
    {
      revalidateOnFocus: false,
      dedupingInterval: 30_000, // 30s 内相同 key 不重复请求
      fallbackData: [],
    }
  );

  return {
    channels: data ?? [],
    isLoading,
    error,
    refresh: mutate,
  };
}
