"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { X, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { getLoginQrKey, createLoginQr, checkLoginQrStatus } from "@/lib/api";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type QrStatus = "loading" | "ready" | "scanning" | "success" | "expired" | "error";

export function LoginModal({ isOpen, onClose, onSuccess }: LoginModalProps) {
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [status, setStatus] = useState<QrStatus>("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [countdown, setCountdown] = useState(300);

  const qrKeyRef = useRef<string | null>(null);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isOpenRef = useRef(isOpen);

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  const stopAllTimers = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
  }, []);

  const resetState = useCallback(() => {
    stopAllTimers();
    setQrImage(null);
    qrKeyRef.current = null;
    setStatus("loading");
    setErrorMessage("");
    setCountdown(300);
  }, [stopAllTimers]);

  const startPolling = useCallback(
    (key: string) => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      pollTimerRef.current = setInterval(async () => {
        if (!isOpenRef.current) {
          if (pollTimerRef.current) {
            clearInterval(pollTimerRef.current);
            pollTimerRef.current = null;
          }
          return;
        }
        try {
          const result = await checkLoginQrStatus(key);
          if (result.code === 803) {
            setStatus("success");
            stopAllTimers();
            setTimeout(() => {
              onSuccess?.();
              onClose();
            }, 1500);
          } else if (result.code === 800) {
            setStatus("expired");
            stopAllTimers();
          } else if (result.code === 802) {
            setStatus("scanning");
          }
        } catch (error) {
          console.error("轮询检查失败:", error);
        }
      }, 2500);
    },
    [stopAllTimers, onSuccess, onClose]
  );

  const startCountdown = useCallback(() => {
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    countdownTimerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (countdownTimerRef.current) {
            clearInterval(countdownTimerRef.current);
            countdownTimerRef.current = null;
          }
          setStatus("expired");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const initQrCode = useCallback(async () => {
    resetState();
    setStatus("loading");
    try {
      const key = await getLoginQrKey();
      if (!key) {
        setStatus("error");
        setErrorMessage("获取二维码失败，请重试");
        return;
      }
      qrKeyRef.current = key;
      const qrimg = await createLoginQr(key);
      if (!qrimg) {
        setStatus("error");
        setErrorMessage("生成二维码失败，请重试");
        return;
      }
      setQrImage(qrimg);
      setStatus("ready");
      startPolling(key);
      startCountdown();
    } catch (error) {
      console.error("初始化二维码失败:", error);
      setStatus("error");
      setErrorMessage("初始化失败，请重试");
    }
  }, [resetState, startPolling, startCountdown]);

  useEffect(() => {
    if (isOpen) initQrCode();
    else resetState();
    return () => {
      stopAllTimers();
    };
  }, [isOpen, initQrCode, resetState, stopAllTimers]);

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getStatusDisplay = (): { icon: React.ReactNode; text: string } => {
    switch (status) {
      case "loading":
        return {
          icon: <Loader2 className="text-accent h-14 w-14 animate-spin" />,
          text: "正在生成二维码...",
        };
      case "ready":
        return { icon: null, text: "请使用网易云 App 扫码登录" };
      case "scanning":
        return {
          icon: <Loader2 className="text-accent h-14 w-14 animate-spin" />,
          text: "已扫码，请在手机上确认授权",
        };
      case "success":
        return { icon: <CheckCircle className="h-14 w-14 text-emerald-500" />, text: "登录成功！" };
      case "expired":
        return { icon: <AlertCircle className="h-14 w-14 text-stone-400" />, text: "二维码已过期" };
      case "error":
        return {
          icon: <AlertCircle className="h-14 w-14 text-stone-400" />,
          text: errorMessage || "发生错误",
        };
      default:
        return { icon: null, text: "" };
    }
  };

  if (!isOpen) return null;

  const statusDisplay = getStatusDisplay();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      <div className="bg-surface border-border/40 relative mx-4 w-96 max-w-full rounded-xl border p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 transition-colors hover:text-stone-800"
        >
          <X size={18} />
        </button>

        <h2 className="mb-6 text-center text-lg font-medium text-stone-800">网易云音乐登录</h2>

        <div className="flex min-h-[280px] flex-col items-center justify-center">
          {status === "ready" && qrImage ? (
            <div className="relative">
              <img
                src={qrImage}
                alt="登录二维码"
                className="ring-border/30 h-48 w-48 rounded-lg ring-1"
              />
              {countdown > 0 && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-stone-800/70 px-3 py-1 backdrop-blur-sm">
                  <span className="font-mono text-[11px] text-white">
                    {formatCountdown(countdown)}
                  </span>
                </div>
              )}
            </div>
          ) : status === "success" ? (
            <div className="text-center">
              {statusDisplay.icon}
              <p className="mt-4 text-[13px] font-medium text-emerald-600">{statusDisplay.text}</p>
            </div>
          ) : status === "expired" || status === "error" ? (
            <div className="text-center">
              {statusDisplay.icon}
              <p className="mt-4 text-[13px] text-stone-500">{statusDisplay.text}</p>
              <button
                onClick={initQrCode}
                className="bg-accent/10 text-accent hover:bg-accent/15 mt-4 rounded-lg px-5 py-2 text-[13px] font-medium transition-all"
              >
                重新生成
              </button>
            </div>
          ) : status === "scanning" ? (
            <div className="text-center">
              {statusDisplay.icon}
              <p className="mt-4 text-[13px] text-stone-600">{statusDisplay.text}</p>
            </div>
          ) : (
            <div className="text-center">
              {statusDisplay.icon}
              <p className="mt-4 text-[13px] text-stone-500">{statusDisplay.text}</p>
            </div>
          )}
        </div>

        {status === "ready" && (
          <p className="mt-4 text-center text-[11px] text-stone-400/60">
            打开网易云 App → 扫一扫 → 扫描二维码
          </p>
        )}
      </div>
    </div>
  );
}
