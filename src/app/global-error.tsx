"use client";

import { useEffect } from "react";
import { Music, RefreshCw, AlertCircle } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("全局致命错误:", error);
  }, [error]);

  return (
    <html lang="zh-CN">
      <body>
        <div className="flex min-h-screen items-center justify-center bg-[#F5F1E6] p-4">
          <div className="w-full max-w-md rounded-3xl border border-[#D4858A]/10 bg-white/80 p-8 text-center shadow-lg backdrop-blur-xl">
            <div className="mx-auto mb-6 flex h-16 w-16 rotate-3 items-center justify-center rounded-2xl bg-red-50">
              <AlertCircle className="h-8 w-8 text-red-400" />
            </div>

            <h2 className="mb-3 text-2xl font-bold text-stone-800">系统严重故障</h2>

            <p className="mb-8 text-sm leading-relaxed text-stone-500">
              电台基础运行环境遇到了严重问题。
              <br />
              请尝试刷新页面恢复运行。
            </p>

            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <button
                onClick={() => reset()}
                className="flex items-center justify-center gap-2 rounded-xl bg-[#D4858A] px-6 py-3 font-medium text-white transition-all hover:bg-[#D4858A]/90"
              >
                <RefreshCw className="h-4 w-4" />
                <span>全局刷新</span>
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
