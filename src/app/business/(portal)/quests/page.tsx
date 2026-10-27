"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { cx, fmt, naira } from "@/components/ui";
import { costEach, heldFor, spentOn, taskById } from "@/lib/business-data";
import { useBusiness } from "../../business-store";
import { PortalHeader, QuestStatusPill, pickClass } from "../portal-shell";

const FILTERS = ["All", "Live", "In review", "Draft", "Ended"] as const;
const COLS = "grid-cols-[2.6fr_1fr_1.4fr_1fr_1.2fr_1fr]";

export default function QuestsPage() {
  const b = useBusiness();
  const router = useRouter();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const cs = b.campaigns;
  const done = cs.reduce((a, c) => a + c.done, 0);
  const rows = cs.filter((c) => filter === "All" || c.status === filter || (filter === "Live" && c.status === "Paused") || (filter === "In review" && c.status === "Waiting for verification"));
  const kpis = [
    { label: "Spent this month", value: naira(cs.reduce((a, c) => a + (c.status !== "Ended" ? spentOn(c) : 0), 0)), note: "Rewards plus 15% fee" },
    { label: "Verified completions", value: fmt(done), note: "All Quests" },
    { label: "Cost per completion", value: naira(cs.reduce((a, c) => a + spentOn(c), 0) / Math.max(1, done)), note: "Average" },
    { label: "Held for live Quests", value: naira(cs.reduce((a, c) => a + heldFor(c), 0)), note: "Released as they end" },
  ];

  return (
    <>
      <PortalHeader title="Quests" sub={cs.length ? `${cs.length} Quests · ${cs.filter((c) => c.status === "Live").length} live` : "Build your first Quest to reach developers in Nigeria."}>
        <Link href="/business/quests/new" className="tap inline-flex min-h-11 items-center rounded-full border border-orange bg-orange px-[18px] text-sm font-semibold text-[#1A0E03] hover:bg-orange-pressed">
          New Quest
        </Link>
      </PortalHeader>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-2.5">
        {kpis.map((k) => (
          <div key={k.label} className="flex flex-col gap-1.5 rounded-[14px] border border-line bg-card p-4">
            <span className="text-[13px] text-muted">{k.label}</span>
            <span className="mono text-[22px] font-medium">{k.value}</span>
            <span className="text-xs text-muted">{k.note}</span>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)} className={cx("tap flex min-h-9 items-center rounded-full border px-3.5 text-[13px]", pickClass(filter === f))}>
            {f}
          </button>
        ))}
      </div>
      {rows.length ? (
        <div className="overflow-x-auto rounded-2xl border border-line">
          <div className="min-w-[760px]">
            <div className={cx("grid gap-2.5 border-b border-line px-4 py-3 text-[11px] font-semibold tracking-[0.08em] text-muted uppercase", COLS)}>
              <span>Quest</span>
              <span>Status</span>
              <span>Completions</span>
              <span>Reward</span>
              <span>Spent</span>
              <span>Cost each</span>
            </div>
            {rows.map((c) => {
              const t = taskById(c.task);
              return (
                <div
                  key={c.id}
                  role="link"
                  tabIndex={0}
                  onClick={() => router.push(`/business/quests/${c.id}`)}
                  onKeyDown={(e) => e.key === "Enter" && router.push(`/business/quests/${c.id}`)}
                  className={cx("grid min-h-16 cursor-pointer items-center gap-2.5 border-b border-raised px-4 py-2 text-[13px] last:border-b-0 hover:bg-card", COLS)}
                >
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-sm leading-snug font-semibold">{c.title}</span>
                    <span className="text-xs text-muted">
                      {t.label} · {c.spaces.length} {c.spaces.length === 1 ? "Space" : "Spaces"}
                      {c.status === "Live" ? ` · ends ${c.ends}` : ""}
                    </span>
                  </span>
                  <span>
                    <QuestStatusPill status={c.status} />
                  </span>
                  <span className="flex flex-col gap-[5px]">
                    <span className="mono">
                      {fmt(c.done)} / {fmt(c.cap)}
                    </span>
                    <span className="h-1.5 overflow-hidden rounded-full bg-raised">
                      <span className="block h-full rounded-full bg-orange" style={{ width: `${(c.done / c.cap) * 100}%` }} />
                    </span>
                  </span>
                  <span className="mono text-gold-ink">✦ {c.reward}</span>
                  <span className="mono">{naira(spentOn(c))}</span>
                  <span className="mono">{c.done ? naira(costEach(c.reward)) : "–"}</span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <span className="text-sm text-muted">No Quests here yet.</span>
      )}
    </>
  );
}
