"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";

import { Button } from "./ui";

/** Centred dialog over a dimmed page. Escape and the backdrop close it. */
export function Modal({ open, onClose, title, sub, children, footer, width = 460 }: { open: boolean; onClose: () => void; title: string; sub?: ReactNode; children?: ReactNode; footer?: ReactNode; width?: number }) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    // Focus the first field, or the dialog itself.
    const first = box.current?.querySelector<HTMLElement>("input, textarea, select");
    (first ?? box.current)?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      prev?.focus?.();
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/55 p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={box} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} className="rise flex max-h-[calc(100vh-32px)] w-full flex-col gap-4 overflow-y-auto rounded-2xl border border-line bg-card p-[22px] shadow-[0_20px_60px_rgba(0,0,0,.45)] outline-none" style={{ maxWidth: width }}>
        <div className="flex flex-col gap-1.5">
          <h2 className="text-[19px] font-bold leading-tight tracking-[-0.02em]">{title}</h2>
          {sub && <span className="text-sm leading-relaxed text-muted">{sub}</span>}
        </div>
        {children}
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-raised pt-3.5">{footer}</div>}
      </div>
    </div>
  );
}

export type ConfirmOptions = { title: string; body?: ReactNode; confirm?: string; danger?: boolean };
const ConfirmCtx = createContext<(o: ConfirmOptions) => Promise<boolean>>(async () => true);

/** `const ok = await confirm({...})` from anywhere under the provider. */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [opts, setOpts] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((v: boolean) => void) | null>(null);
  const ask = useCallback((o: ConfirmOptions) => {
    resolver.current?.(false);
    setOpts(o);
    return new Promise<boolean>((res) => (resolver.current = res));
  }, []);
  const close = useCallback((v: boolean) => {
    resolver.current?.(v);
    resolver.current = null;
    setOpts(null);
  }, []);
  const cancel = useCallback(() => close(false), [close]);
  return (
    <ConfirmCtx.Provider value={ask}>
      {children}
      <Modal
        open={!!opts}
        onClose={cancel}
        title={opts?.title ?? ""}
        sub={opts?.body}
        width={420}
        footer={
          <>
            <Button onClick={cancel}>Cancel</Button>
            <Button kind={opts?.danger ? "danger" : "primary"} onClick={() => close(true)} autoFocus>
              {opts?.confirm ?? "Confirm"}
            </Button>
          </>
        }
      />
    </ConfirmCtx.Provider>
  );
}

export const useConfirm = () => useContext(ConfirmCtx);
