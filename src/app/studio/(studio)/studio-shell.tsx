"use client";

import { ArrowLeft } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { ThemeToggle } from "@/components/theme-toggle";
import { useToast } from "@/components/toast";
import { Mark, cx, fmt } from "@/components/ui";
import { CREATOR, ITEMS } from "@/lib/studio-data";
import { useStudio } from "./studio-store";

/** Fixed 220px sidebar, content fills the rest. Same frame as the admin site. */
export function StudioShell({ children }: { children: ReactNode }) {
  const st = useStudio();
  const path = usePathname();
  const toast = useToast();
  const nav = [
    { href: "/studio", label: "Overview" },
    { href: "/studio/items", label: "Items", count: ITEMS.length },
    { href: "/studio/bundles", label: "Bundles", count: st.bundles.length },
    { href: "/studio/promotions", label: "Promotions" },
    { href: "/studio/collaborators", label: "Collaborators" },
    { href: "/studio/storefront", label: "Storefront" },
  ];
  const on = (href: string) => (href === "/studio" ? path === "/studio" : path.startsWith(href));

  return (
    <div className="flex min-h-screen flex-wrap bg-ground text-ink">
      <nav className="flex w-full shrink-0 flex-col gap-[22px] border-b border-raised bg-card px-3.5 py-[22px] md:sticky md:top-0 md:h-screen md:w-[220px] md:overflow-y-auto md:border-r md:border-b-0">
        <Link href="/" className="flex items-center gap-2.5 px-2">
          <Mark size={28} />
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-[-0.02em]">Heurekka</span>
            <span className="mono text-[10px] uppercase tracking-[0.12em] text-muted">Creator Studio</span>
          </div>
        </Link>
        <div className="flex flex-col gap-1">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className={cx("tap flex min-h-11 items-center justify-between gap-2 rounded-[10px] px-3 text-sm font-medium", on(n.href) ? "bg-raised text-ink" : "text-muted hover:text-ink")}>
              {n.label}
              {n.count ? <span className="mono text-xs text-lift">{n.count}</span> : null}
            </Link>
          ))}
        </div>
        <div className="flex flex-col gap-1.5 rounded-[14px] bg-sparkbg p-3.5">
          <span className="text-xs font-semibold text-gold-ink">Ready to move</span>
          <span className="mono text-[22px] font-medium">✦ {fmt(CREATOR.ready)}</span>
          <span className="text-xs text-soft">
            ✦ {CREATOR.clearing} clearing · next {CREATOR.nextClear}
          </span>
          <button type="button" onClick={() => toast("Cash out from Wallet in the Heurekka app.")} className="self-start text-xs font-semibold underline-offset-2 hover:underline">
            Cash out in the app
          </button>
        </div>
        <div className="mt-auto flex flex-col gap-2.5 px-1.5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-navy text-[13px] font-bold text-white">{CREATOR.ini}</span>
            <div className="flex flex-col">
              <span className="text-[13px] font-semibold">{CREATOR.name}</span>
              <span className="text-xs text-muted">Leader · {fmt(CREATOR.followers)} followers</span>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </nav>
      <main className="flex min-w-0 flex-[1_1_640px] flex-col gap-5 px-[clamp(16px,3vw,36px)] pt-6 pb-12">{children}</main>
    </div>
  );
}

export function StudioHeader({ title, sub, back, actions }: { title: string; sub: string; back?: string; actions?: boolean }) {
  const toast = useToast();
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="flex items-center gap-1.5">
        {back && (
          <Link href={back} aria-label="Back" className="tap -ml-3 flex h-11 w-11 items-center justify-center rounded-full text-muted hover:text-ink">
            <ArrowLeft size={19} />
          </Link>
        )}
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-[-0.025em]">{title}</h1>
          <span className="text-sm text-muted">{sub}</span>
        </div>
      </div>
      {actions && (
        <div className="flex flex-wrap gap-2">
          <Link href="/studio/themes/editor" className="tap inline-flex min-h-11 items-center rounded-full border border-orange bg-orange px-[18px] text-sm font-semibold text-[#1A0E03] hover:bg-orange-pressed">
            New theme
          </Link>
          <button type="button" onClick={() => toast("Memoji Packs, Personas and Tool Kits are made in the app Studio.")} className="tap inline-flex min-h-11 items-center rounded-full border border-line px-[18px] text-sm font-semibold hover:border-muted">
            New pack
          </button>
        </div>
      )}
    </div>
  );
}

/** Status pill shared by items, versions and promotions. */
export function StatusPill({ status }: { status: string }) {
  const tone = status === "Live" ? "bg-okbg text-ok" : status === "Scheduled" ? "bg-warm text-lift" : "bg-raised text-muted";
  return <span className={cx("rounded-full px-[9px] py-[3px] text-[11px] font-semibold whitespace-nowrap", tone)}>{status}</span>;
}

export function Swatch({ bg, glyph, className }: { bg: string; glyph: string; className?: string }) {
  return (
    <span className={cx("flex shrink-0 items-center justify-center text-white", className)} style={{ background: bg }}>
      {glyph}
    </span>
  );
}

/** Bordered pick row used for selections (filters, bundle items, featured order). */
export const pickClass = (on: boolean) => (on ? "border-orange bg-warm text-lift" : "border-line bg-transparent text-ink hover:border-muted");
