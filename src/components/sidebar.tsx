"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Radio, Settings, User, LogOut, Loader2, Music, Disc3, BookOpen } from "lucide-react";
import { useUser } from "@/contexts/user-context";
import { LoginModal } from "@/components/login-modal";
import { logout } from "@/lib/api";
import { getChannels, onChannelsChanged } from "@/lib/storage";
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
    setChannels(getChannels());
  }, []);

  useEffect(() => {
    const unsubscribe = onChannelsChanged(() => {
      setChannels(getChannels());
    });
    return unsubscribe;
  }, []);

  const handleLogout = async () => {
    await logout();
    await refreshUser();
  };

  return (
    <>
      <aside className="fixed left-0 top-0 w-60 h-full bg-surface/80 backdrop-blur-md border-r border-border/60 z-40 overflow-y-auto scrollbar-hide flex flex-col">
        {/* Logo */}
        <div className="p-7 pb-5">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent-dim flex items-center justify-center shadow-lg shadow-accent/15 group-hover:shadow-accent/25 transition-shadow">
              <Disc3 size={18} className="text-white" strokeWidth={2} />
            </div>
            <span className="text-base font-semibold text-text-primary tracking-tight">
              个人电台
            </span>
          </Link>
        </div>

        {/* 导航链接 */}
        <nav className="px-3 flex-1">
          <div className="mb-1">
            <span className="px-4 text-[10px] font-medium text-text-secondary/60 uppercase tracking-[0.15em]">
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
                className={`flex items-center px-4 py-2 mb-0.5 rounded-lg transition-all duration-200 group ${
                  isActive
                    ? "bg-accent/10 text-accent"
                    : "text-text-secondary hover:text-text-primary hover:bg-accent/5"
                }`}
              >
                <Icon size={17} className="mr-3 flex-shrink-0" strokeWidth={isActive ? 2 : 1.5} />
                <span className="text-[13px] font-medium">{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-accent" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* 频道列表 */}
        {mounted && channels.length > 0 && (
          <div className="px-3 mt-4">
            <div className="flex items-center justify-between px-4 mb-2">
              <span className="text-[10px] font-medium text-text-secondary/60 uppercase tracking-[0.15em]">
                频道
              </span>
              <span className="text-[10px] text-text-secondary/40 tabular-nums">
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
                    className={`flex items-center px-4 py-2 rounded-lg transition-all duration-200 ${
                      isActive
                        ? "bg-accent/10 text-accent"
                        : "text-text-secondary hover:text-text-primary hover:bg-accent/5"
                    }`}
                  >
                    <Music size={14} className="mr-3 flex-shrink-0" strokeWidth={isActive ? 2 : 1.5} />
                    <span className="text-[13px] truncate flex-1">{channel.name}</span>
                    <span className={`text-[10px] tabular-nums ${isActive ? "text-accent/50" : "text-text-secondary/30"}`}>
                      {channel.songIds.length}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* 用户信息 */}
        <div className="px-3 mt-auto pt-5 pb-24 border-t border-border/60">
          {loading ? (
            <div className="flex items-center px-4 py-2 text-text-secondary">
              <Loader2 size={16} className="mr-3 animate-spin" />
              <span className="text-[13px]">加载中...</span>
            </div>
          ) : isLogin && user ? (
            <div className="space-y-0.5">
              <div className="flex items-center px-4 py-2.5">
                <img
                  src={user.avatarUrl}
                  alt={user.nickname}
                  className="w-8 h-8 rounded-full ring-2 ring-accent/20"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/default-avatar.svg";
                  }}
                />
                <div className="ml-3 overflow-hidden">
                  <p className="text-[13px] text-text-primary font-medium truncate">
                    {user.nickname}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-2 text-text-secondary hover:text-text-primary rounded-lg transition-colors"
              >
                <LogOut size={15} className="mr-3" strokeWidth={1.5} />
                <span className="text-[13px]">退出登录</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowLoginModal(true)}
              className="flex items-center w-full px-4 py-2.5 text-text-secondary hover:text-text-primary hover:bg-accent/5 rounded-lg transition-colors"
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
