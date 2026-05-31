"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle } from "lucide-react";

export function showToast(message: string) {
  window.dispatchEvent(
    new CustomEvent("app-toast", { detail: { message } })
  );
}

export function Toast() {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const dismiss = useCallback(() => {
    setVisible(false);
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const msg = (e as CustomEvent).detail?.message;
      if (!msg) return;
      clearTimeout(timerRef.current);
      setMessage(msg);
      setVisible(true);
      timerRef.current = setTimeout(dismiss, 2800);
    };
    window.addEventListener("app-toast", handler);
    return () => {
      window.removeEventListener("app-toast", handler);
      clearTimeout(timerRef.current);
    };
  }, [dismiss]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed top-8 left-1/2 z-[9999] pointer-events-none"
          initial={{ opacity: 0, x: "-50%", y: -16, scale: 0.95 }}
          animate={{ opacity: 1, x: "-50%", y: 0, scale: 1, transition: { type: "spring", stiffness: 400, damping: 26, mass: 0.8 } }}
          exit={{ opacity: 0, x: "-50%", y: -10, scale: 0.97, transition: { duration: 0.18, ease: "easeIn" } }}
        >
          <div className="flex items-center gap-2.5 pl-4 pr-5 py-2.5 rounded-xl bg-white/90 backdrop-blur-xl shadow-[0_8px_32px_rgba(61,46,46,0.1),0_2px_8px_rgba(61,46,46,0.06),0_0_0_1px_rgba(223,218,209,0.5)]">
            <AlertCircle size={15} className="text-accent flex-shrink-0" />
            <span className="text-[13px] text-stone-700 whitespace-nowrap">
              {message}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
