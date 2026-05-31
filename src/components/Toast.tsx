"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { AlertCircle } from "lucide-react";

export function showToast(message: string) {
  window.dispatchEvent(
    new CustomEvent("app-toast", { detail: { message } })
  );
}

export function Toast() {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [exiting, setExiting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const dismiss = useCallback(() => {
    setExiting(true);
    setTimeout(() => {
      setVisible(false);
      setExiting(false);
    }, 280);
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const msg = (e as CustomEvent).detail?.message;
      if (!msg) return;
      clearTimeout(timerRef.current);
      setMessage(msg);
      setVisible(true);
      setExiting(false);
      timerRef.current = setTimeout(dismiss, 2800);
    };
    window.addEventListener("app-toast", handler);
    return () => {
      window.removeEventListener("app-toast", handler);
      clearTimeout(timerRef.current);
    };
  }, [dismiss]);

  if (!visible) return null;

  return (
    <div
      className={`fixed top-6 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none ${
        exiting ? "toast-exit" : "toast-enter"
      }`}
    >
      <div className="flex items-center gap-2.5 pl-4 pr-5 py-2.5 rounded-xl bg-white/85 backdrop-blur-xl shadow-[0_4px_24px_rgba(61,46,46,0.08),0_0_0_1px_rgba(223,218,209,0.6)]">
        <AlertCircle size={15} className="text-accent flex-shrink-0" />
        <span className="text-[13px] text-text-secondary whitespace-nowrap">
          {message}
        </span>
      </div>
    </div>
  );
}
