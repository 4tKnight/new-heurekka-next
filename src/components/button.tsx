"use client";

import { useState, type ButtonHTMLAttributes, type MouseEvent } from "react";

import { cx } from "./cx";

export type ButtonKind = "primary" | "neutral" | "danger" | "text" | "gold" | "ghost";

const buttonKinds: Record<ButtonKind, string> = {
  // Orange with black ink. One primary per detail pane.
  primary: "bg-orange text-[#1A0E03] border border-orange hover:bg-orange-pressed hover:border-orange-pressed",
  neutral: "bg-ground text-ink border border-line hover:border-muted",
  // Destructive actions are red-outlined and sit last.
  danger: "bg-errbg text-err border border-err",
  text: "text-lift border border-transparent px-1.5",
  gold: "bg-gold text-black border border-gold",
  ghost: "text-muted border border-transparent hover:text-ink",
};

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick"> & {
  kind?: ButtonKind;
  size?: "sm" | "md" | "lg";
  /** Forces the loading state, e.g. while a form submits. */
  loading?: boolean;
  /** An async handler shows the loading dots until its promise settles. */
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void | Promise<unknown>;
};

/**
 * The site's button. If `onClick` returns a promise, the label fades out,
 * three dots pulse in its place (same width, so nothing shifts) and further
 * clicks are ignored until it settles — so every server call shows it was
 * heard, the same way as the app.
 */
export function Button({ kind = "neutral", size = "md", className, children, loading, onClick, disabled, ...rest }: Props) {
  const [busy, setBusy] = useState(false);
  const isLoading = busy || !!loading;
  const sizes = { sm: "min-h-9 px-3 text-[13px]", md: "min-h-11 px-4 text-sm", lg: "min-h-[52px] px-5 text-base" };

  async function handle(e: MouseEvent<HTMLButtonElement>) {
    if (isLoading || !onClick) return;
    const r = onClick(e);
    if (!(r instanceof Promise)) return;
    setBusy(true);
    try {
      await r;
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      aria-busy={isLoading || undefined}
      disabled={disabled}
      onClick={handle}
      className={cx(
        "tap relative inline-flex items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap",
        // Loading keeps the button's colours; only a disabled one greys out.
        !isLoading && "disabled:cursor-not-allowed disabled:bg-raised disabled:border-raised disabled:text-[#6B7C8C]",
        isLoading && "cursor-progress",
        sizes[size],
        buttonKinds[kind],
        className,
      )}
      {...rest}
    >
      <span className={cx("inline-flex items-center gap-2 transition-opacity duration-150", isLoading && "opacity-0")}>{children}</span>
      {isLoading && (
        <span className="hk-dots absolute inset-0 flex items-center justify-center gap-1" aria-hidden>
          <i />
          <i />
          <i />
        </span>
      )}
    </button>
  );
}
