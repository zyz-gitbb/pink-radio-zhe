"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Radio, Settings, User, LogOut, Loader2, Music, Disc3, BookOpen } from "lucide-react";
import { useUser } from "@/contexts/user-context";
import { LoginModal } from "@/components/login-modal";
import { logout } from "@/lib/api";
import { getChannels } from "@/app/actions";
import type { Channel } from "@/types";

const navItems = [
  { href: "/", label: "首页", icon: Home },
  { href: "/radio", label: "个性化电台", icon: Radio },
  { href: "/diary", label: "音乐手账", icon: BookOpen },
  { href: "/admin", label: "管理后台", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, isLogin, loading, refreshUser } = useUser();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    getChannels().then(setChannels);
  }, []);

  const handleLogout = async () => {
    await logout();
    await refreshUser();
  };

  return (
    <>
      <aside className="bg-surface/80 border-border/60 scrollbar-hide fixed top-0 left-0 z-40 flex h-full w-60 flex-col overflow-y-auto border-r backdrop-blur-md">
        {/* Logo */}
        <div className="p-7 pb-5">
          <Link href="/" className="group flex items-center gap-2.5">
            <div className="from-accent to-accent-dim shadow-accent/15 group-hover:shadow-accent/25 flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br shadow-lg transition-shadow">
              <Disc3 size={18} className="text-white" strokeWidth={2} />
            </div>
            <span className="text-text-primary text-base font-semibold tracking-tight">
              个人电台
            </span>
          </Link>
        </div>

        {/* 导航链接 */}
        <nav className="flex-1 px-3">
          <div className="mb-1">
            <span className="text-text-secondary/60 px-4 text-[10px] font-medium tracking-[0.15em] uppercase">
              浏览
            </span>
          </div>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group mb-0.5 flex items-center rounded-lg px-4 py-2 transition-all duration-200 ${
                  isActive
                    ? "bg-accent/10 text-accent"
                    : "text-text-secondary hover:text-text-primary hover:bg-accent/5"
                }`}
              >
                <Icon size={17} className="mr-3 flex-shrink-0" strokeWidth={isActive ? 2 : 1.5} />
                <span className="text-[13px] font-medium">{item.label}</span>
                {isActive && <div className="bg-accent ml-auto h-1.5 w-1.5 rounded-full" />}
              </Link>
            );
          })}
        </nav>

        {/* 频道列表 */}
        {mounted && channels.length > 0 && (
          <div className="mt-4 px-3">
            <div className="mb-2 flex items-center justify-between px-4">
              <span className="text-text-secondary/60 text-[10px] font-medium tracking-[0.15em] uppercase">
                频道
              </span>
              <span className="text-text-secondary/40 text-[10px] tabular-nums">
                {channels.length}
              </span>
            </div>
            <div className="space-y-0.5">
              {channels.map((channel) => {
                const isActive = pathname === `/channel/${channel.id}`;
                return (
                  <Link
                    key={channel.id}
                    href={`/channel/${channel.id}`}
                    className={`flex items-center rounded-lg px-4 py-2 transition-all duration-200 ${
                      isActive
                        ? "bg-accent/10 text-accent"
                        : "text-text-secondary hover:text-text-primary hover:bg-accent/5"
                    }`}
                  >
                    <Music
                      size={14}
                      className="mr-3 flex-shrink-0"
                      strokeWidth={isActive ? 2 : 1.5}
                    />
                    <span className="flex-1 truncate text-[13px]">{channel.name}</span>
                    <span
                      className={`text-[10px] tabular-nums ${isActive ? "text-accent/50" : "text-text-secondary/30"}`}
                    >
                      {channel.songIds.length}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* 用户信息 */}
        <div className="border-border/60 mt-auto border-t px-3 pt-5 pb-24">
          {loading ? (
            <div className="text-text-secondary flex items-center px-4 py-2">
              <Loader2 size={16} className="mr-3 animate-spin" />
              <span className="text-[13px]">加载中...</span>
            </div>
          ) : isLogin && user ? (
            <div className="space-y-0.5">
              <div className="flex items-center px-4 py-2.5">
                <img
                  src={user.avatarUrl}
                  alt={user.nickname}
                  className="ring-accent/20 h-8 w-8 rounded-full ring-2"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/default-avatar.svg";
                  }}
                />
                <div className="ml-3 overflow-hidden">
                  <p className="text-text-primary truncate text-[13px] font-medium">
                    {user.nickname}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="text-text-secondary hover:text-text-primary flex w-full items-center rounded-lg px-4 py-2 transition-colors"
              >
                <LogOut size={15} className="mr-3" strokeWidth={1.5} />
                <span className="text-[13px]">退出登录</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowLoginModal(true)}
              className="text-text-secondary hover:text-text-primary hover:bg-accent/5 flex w-full items-center rounded-lg px-4 py-2.5 transition-colors"
            >
              <User size={17} className="mr-3" strokeWidth={1.5} />
              <span className="text-[13px]">登录</span>
            </button>
          )}
        </div>
      </aside>

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={refreshUser}
      />
    </>
  );
}
