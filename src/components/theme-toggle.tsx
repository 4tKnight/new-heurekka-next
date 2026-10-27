"use client";

import { Moon, Sun } from "@phosphor-icons/react";
import { useSyncExternalStore } from "react";

const subscribe = (cb: () => void) => {
  const obs = new MutationObserver(cb);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => obs.disconnect();
};
const isLight = () => document.documentElement.getAttribute("data-theme") === "light";

/** Dark is the default; light is a complete second theme. */
export function ThemeToggle({ className }: { className?: string }) {
  const light = useSyncExternalStore(subscribe, isLight, () => false);
  const flip = () => {
    const next = !light;
    if (next) document.documentElement.setAttribute("data-theme", "light");
    else document.documentElement.removeAttribute("data-theme");
    try {
      localStorage.setItem("hk-theme", next ? "light" : "dark");
    } catch {}
  };
  return (
    <button type="button" onClick={flip} aria-label={light ? "Switch to dark theme" : "Switch to light theme"} className={`tap mono inline-flex min-h-9 items-center gap-2 text-[11px] uppercase tracking-[0.06em] text-muted hover:text-ink ${className ?? ""}`}>
      {light ? <Moon size={14} /> : <Sun size={14} />}
      {light ? "Dark" : "Light"}
    </button>
  );
}
