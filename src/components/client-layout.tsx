"use client";

import { PlayerProvider } from "@/contexts/player-context";
import { UserProvider } from "@/contexts/user-context";
import { Sidebar } from "@/components/sidebar";
import { Player } from "@/components/Player";
import { Toast } from "@/components/Toast";
import { BackgroundStamps } from "@/components/background-stamps";
import { DataMigrator } from "@/components/data-migrator";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <PlayerProvider>
        <DataMigrator />
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
