"use client";

import { PlayerProvider } from "@/contexts/player-context";
import { UserProvider } from "@/contexts/user-context";
import { Sidebar } from "@/components/sidebar";
import { Player } from "@/components/Player";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <PlayerProvider>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 ml-60 pb-32">{children}</main>
        </div>
        <Player />
      </PlayerProvider>
    </UserProvider>
  );
}
