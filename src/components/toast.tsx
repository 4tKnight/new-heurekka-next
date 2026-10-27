"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";

const ToastContext = createContext<(msg: string) => void>(() => {});

/** Toasts rise from the bottom and clear after 2.4s. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const show = useCallback((m: string) => {
    setMsg(m);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(null), 2400);
  }, []);
  return (
    <ToastContext.Provider value={show}>
      {children}
      {msg && (
        <div role="status" className="rise fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink px-[18px] py-3 text-sm font-semibold text-inv-fg shadow-[0_10px_30px_rgba(0,0,0,.4)]">
          {msg}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
