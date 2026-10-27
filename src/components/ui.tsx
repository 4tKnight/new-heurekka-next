import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

import { cx } from "./cx";

export { cx } from "./cx";
export { Button, type ButtonKind } from "./button";

export type Tone = "red" | "orange" | "gold" | "grey" | "green";

const tones: Record<Tone, string> = {
  red: "bg-errbg text-err",
  orange: "bg-warm text-lift",
  gold: "bg-sparkbg text-gold-ink",
  grey: "bg-raised text-soft",
  green: "bg-okbg text-ok",
};

/** Severity and status badges always carry a word, never colour alone. */
export function Badge({ tone = "grey", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return <span className={cx("inline-flex items-center rounded-full px-2 py-[3px] text-[10px] font-semibold uppercase tracking-[0.08em] whitespace-nowrap", tones[tone], className)}>{children}</span>;
}

export function Card({ children, className, ...rest }: { children: ReactNode; className?: string } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cx("rounded-xl border border-line bg-card", className)} {...rest}>
      {children}
    </div>
  );
}

export function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cx("text-[13px] font-semibold text-muted", className)}>{children}</span>;
}

export function Kicker({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cx("mono text-[11px] uppercase tracking-[0.12em] text-lift", className)}>{children}</span>;
}

export function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] font-semibold text-muted">{label}</span>
      {children}
      {error ? <span className="text-[13px] text-err">{error}</span> : hint ? <span className="text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cx("min-h-[46px] rounded-xl border border-line bg-ground px-3.5 text-[15px] text-ink", className)} {...rest} />;
}

export function TextArea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cx("rounded-xl border border-line bg-ground px-3.5 py-3 text-[15px] leading-normal text-ink", className)} {...rest} />;
}

export function Chip({ on, onClick, children, className }: { on: boolean; onClick?: () => void; children: ReactNode; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx("tap inline-flex min-h-10 items-center rounded-full border px-3.5 text-[13px] font-medium", on ? "border-ink bg-ink text-inv-fg" : "border-line bg-ground text-soft hover:border-muted", className)}
    >
      {children}
    </button>
  );
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={cx("flex h-6 w-10 shrink-0 items-center rounded-full p-0.5 transition-colors", on ? "justify-end bg-orange" : "justify-start bg-raised")}
    >
      <span className="h-5 w-5 rounded-full bg-white" />
    </button>
  );
}

/** − value + control used for rates and rule thresholds. */
export function Stepper({ value, unit, onDec, onInc, disabled, minWidth = 96 }: { value: ReactNode; unit?: string; onDec: () => void; onInc: () => void; disabled?: boolean; minWidth?: number }) {
  return (
    <div className={cx("flex items-center gap-1", disabled && "opacity-40")}>
      <button type="button" aria-label="Decrease" disabled={disabled} onClick={onDec} className="tap flex h-9 w-9 items-center justify-center rounded-lg border border-line">
        −
      </button>
      <span className="mono text-center text-sm" style={{ minWidth }}>
        {value} {unit}
      </span>
      <button type="button" aria-label="Increase" disabled={disabled} onClick={onInc} className="tap flex h-9 w-9 items-center justify-center rounded-lg border border-line">
        +
      </button>
    </div>
  );
}

/** Heurekka mark, switching between the light and dark-ground variants. */
export function Mark({ size = 28 }: { size?: number }) {
  return <span role="img" aria-label="Heurekka" className="inline-block shrink-0 bg-contain bg-center bg-no-repeat" style={{ width: size, height: size, backgroundImage: "var(--hk-mark)" }} />;
}

export function Check({ ok, label }: { ok: boolean; label: ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 text-sm leading-snug">
      <span className={cx("flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full text-xs font-bold", ok ? "bg-okbg text-ok" : "bg-warm text-lift")}>{ok ? "✓" : "!"}</span>
      {label}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <span className={cx("skel block rounded-xl border border-line bg-card", className)} />;
}

export const naira = (n: number) => "₦" + Math.round(n).toLocaleString("en-US");
/** Sparks to naira at the fixed rate ✦10 = ₦1,600. */
export const sparksToNaira = (sparks: number, ratePerSpark = 160) => naira(sparks * ratePerSpark);
export const fmt = (n: number) => n.toLocaleString("en-US");

/** Search box with a clear button. */
export function SearchInput({ value, onChange, placeholder = "Search", className }: { value: string; onChange: (v: string) => void; placeholder?: string; className?: string }) {
  return (
    <div className={cx("relative flex items-center", className)}>
      <span aria-hidden className="pointer-events-none absolute left-3.5 text-muted">
        ⌕
      </span>
      <input type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} className="min-h-11 w-full rounded-xl border border-line bg-ground pr-9 pl-9 text-sm text-ink [&::-webkit-search-cancel-button]:hidden" />
      {value && (
        <button type="button" aria-label="Clear search" onClick={() => onChange("")} className="absolute right-2 flex h-7 w-7 items-center justify-center rounded-full text-muted hover:text-ink">
          ×
        </button>
      )}
    </div>
  );
}

export const PAGE_SIZE = 6;

/** Splits a list into pages. The page is clamped when the list shrinks. */
export function paginate<T>(items: T[], page: number, size = PAGE_SIZE) {
  const pages = Math.max(1, Math.ceil(items.length / size));
  const p = Math.min(Math.max(1, page), pages);
  return { page: p, pages, slice: items.slice((p - 1) * size, p * size), from: items.length ? (p - 1) * size + 1 : 0, to: Math.min(p * size, items.length), total: items.length };
}

export function Pager({ page, pages, from, to, total, onPage, noun = "items" }: { page: number; pages: number; from: number; to: number; total: number; onPage: (p: number) => void; noun?: string }) {
  if (total === 0) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
      <span className="mono text-xs text-muted">
        {from}–{to} of {total} {noun}
      </span>
      {pages > 1 && (
        <div className="flex items-center gap-1">
          <button type="button" aria-label="Previous page" disabled={page <= 1} onClick={() => onPage(page - 1)} className="tap flex h-9 min-w-9 items-center justify-center rounded-lg border border-line px-2 text-sm disabled:opacity-40">
            ‹
          </button>
          {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
            <button key={n} type="button" aria-current={n === page ? "page" : undefined} onClick={() => onPage(n)} className={cx("tap mono flex h-9 min-w-9 items-center justify-center rounded-lg border px-2 text-[13px]", n === page ? "border-orange text-ink" : "border-line text-muted hover:text-ink")}>
              {n}
            </button>
          ))}
          <button type="button" aria-label="Next page" disabled={page >= pages} onClick={() => onPage(page + 1)} className="tap flex h-9 min-w-9 items-center justify-center rounded-lg border border-line px-2 text-sm disabled:opacity-40">
            ›
          </button>
        </div>
      )}
    </div>
  );
}
