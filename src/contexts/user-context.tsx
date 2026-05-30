"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getLoginStatus } from "@/lib/api";

interface User {
  userId: number;
  nickname: string;
  avatarUrl: string;
}

interface UserContextValue {
  user: User | null;
  isLogin: boolean;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLogin, setIsLogin] = useState(false);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    setLoading(true);
    try {
      const status = await getLoginStatus();
      if (status?.isLogin && status.userId) {
        setIsLogin(true);
        setUser({
          userId: status.userId,
          nickname: status.nickname || "网易云用户",
          avatarUrl: status.avatarUrl || "/default-avatar.svg",
        });
      } else {
        setIsLogin(false);
        setUser(null);
      }
    } catch (error) {
      console.error("Failed to fetch user status:", error);
      setIsLogin(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  return (
    <UserContext.Provider value={{ user, isLogin, loading, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within UserProvider");
  }
  return context;
}
