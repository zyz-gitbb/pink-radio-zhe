"use client";

import { useEffect } from "react";
import { PlayerProvider } from "@/contexts/player-context";
import { UserProvider } from "@/contexts/user-context";
import { Sidebar } from "@/components/sidebar";
import { Player } from "@/components/Player";
import { showToast } from "@/components/Toast";
import { Toast } from "@/components/Toast";
import { BackgroundStamps } from "@/components/background-stamps";
import { DataMigrator } from "@/components/data-migrator";

function StartupHealthCheck() {
  useEffect(() => {
    let cancelled = false;
    async function check() {
      try {
        const res = await fetch("/api/netease/login/status?timestamp=" + Date.now(), { method: "GET" });
        if (!cancelled && !res.ok) {
          showToast("网易云接口异常，请确认本地 API 服务已启动");
        }
      } catch {
        if (!cancelled) {
          showToast("无法连接本地网易云 API，请检查 localhost:4000");
        }
      }
    }
    check();
    return () => { cancelled = true; };
  }, []);
  return null;
}

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <PlayerProvider>
        <DataMigrator />
        <StartupHealthCheck />
        <BackgroundStamps />
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="ml-60 flex-1 pb-32">{children}</main>
        </div>
        <Player />
        <Toast />
      </PlayerProvider>
    </UserProvider>
  );
}
