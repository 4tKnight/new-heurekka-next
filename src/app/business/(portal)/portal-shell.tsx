"use client";

import { ArrowLeft, Info } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { ThemeToggle } from "@/components/theme-toggle";
import { useToast } from "@/components/toast";
import { Mark, cx, naira } from "@/components/ui";
import { ROLES, heldFor, type QuestStatus } from "@/lib/business-data";
import { useBusiness } from "../business-store";

/** Same 220px sidebar frame as Studio and admin, with the prepaid balance card. */
export function PortalShell({ children }: { children: ReactNode }) {
  const b = useBusiness();
  const path = usePathname();
  const toast = useToast();
  const held = b.campaigns.reduce((a, c) => a + heldFor(c), 0);
  const me = b.team[0];
  const nav = [
    { href: "/business/quests", label: "Quests", count: b.campaigns.length },
    { href: "/business/quests/new", label: "New Quest" },
    { href: "/business/billing", label: "Billing" },
    { href: "/business/team", label: "Team", count: b.team.length },
    { href: "/business/settings", label: "Business" },
  ];
  const on = (href: string) => (href === "/business/quests" ? path.startsWith(href) && path !== "/business/quests/new" : path === href);

  const approve = () => {
    b.set((s) => ({ verified: true, campaigns: s.campaigns.map((c) => (c.status === "Waiting for verification" ? { ...c, status: "In review" } : c)) }));
    toast(`${b.biz.name} is verified.`);
  };

  return (
    <div className="flex min-h-screen flex-wrap bg-ground text-ink">
      <nav className="flex w-full shrink-0 flex-col gap-[22px] border-b border-raised bg-card px-3.5 py-[22px] md:sticky md:top-0 md:h-screen md:w-[220px] md:overflow-y-auto md:border-r md:border-b-0">
        <Link href="/business" className="flex items-center gap-2.5 px-2">
          <Mark size={28} />
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-[-0.02em]">Heurekka</span>
            <span className="mono text-[10px] uppercase tracking-[0.12em] text-muted">for business</span>
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
        <div className="flex flex-col gap-1.5 rounded-[14px] bg-raised p-3.5">
          <span className="text-xs text-muted">Prepaid balance</span>
          <span className="mono text-xl font-medium">{naira(b.balance)}</span>
          <span className="text-xs text-muted">{naira(held)} held for live Quests</span>
        </div>
        <div className="mt-auto flex flex-col gap-2.5 px-1.5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-[#0BA4DB] text-[13px] font-bold text-black">{(b.biz.name || "B")[0].toUpperCase()}</span>
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-[13px] font-semibold">{b.biz.name || "Your business"}</span>
              <span className="text-xs text-muted">{ROLES.find((r) => r.id === me?.role)?.label}</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <button type="button" onClick={() => toast("Quest campaigns are in Settings in the Heurekka app.")} className="mono min-h-9 text-[11px] uppercase tracking-[0.06em] text-muted hover:text-ink">
              Phone view
            </button>
            <Link href="/business" className="mono flex min-h-9 items-center text-[11px] uppercase tracking-[0.06em] text-muted hover:text-ink">
              Sign out
            </Link>
          </div>
          <ThemeToggle />
        </div>
      </nav>
      <main className="flex min-w-0 flex-[1_1_640px] flex-col gap-5 px-[clamp(16px,3vw,36px)] pt-6 pb-12">
        {!b.verified && (
          <div className="flex flex-wrap items-start gap-3 rounded-[14px] border border-orange bg-warm px-4 py-3.5">
            <Info size={22} weight="fill" className="shrink-0 text-orange" />
            <div className="flex min-w-[220px] flex-1 flex-col gap-1">
              <span className="text-sm font-semibold">We&apos;re checking {b.biz.name}</span>
              <span className="text-[13px] leading-normal text-soft">
                Usually within 1 business day. You can build Quests now, and they launch once you&apos;re verified. We&apos;ll email {b.biz.email}.
              </span>
            </div>
            <button type="button" onClick={approve} className="tap min-h-9 rounded-full border border-line px-3 text-xs text-muted hover:text-ink">
              Prototype: approve
            </button>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}

export function PortalHeader({ title, sub, back, children }: { title: string; sub: string; back?: string; children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="flex items-center gap-1.5">
        {back && (
          <Link href={back} aria-label="Back" className="tap -ml-3 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted hover:text-ink">
            <ArrowLeft size={19} />
          </Link>
        )}
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-[-0.025em]">{title}</h1>
          <span className="text-sm text-muted">{sub}</span>
        </div>
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}

const statusTone: Record<QuestStatus, string> = {
  Live: "bg-okbg text-ok",
  Paused: "bg-warm text-lift",
  "In review": "bg-raised text-soft",
  Draft: "bg-raised text-muted",
  Ended: "bg-raised text-muted",
  "Waiting for verification": "bg-warm text-lift",
};

export function QuestStatusPill({ status }: { status: QuestStatus }) {
  return <span className={cx("rounded-full px-[9px] py-[3px] text-[11px] font-semibold whitespace-nowrap", statusTone[status])}>{status}</span>;
}

/** Bordered option used for radios, chips and filters across the portal. */
export const pickClass = (on: boolean) => (on ? "border-orange bg-warm text-lift" : "border-line bg-transparent text-ink hover:border-muted");
