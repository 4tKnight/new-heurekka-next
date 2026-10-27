"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { useToast } from "@/components/toast";
import { Button, fmt, naira } from "@/components/ui";
import { SPARK_NGN, costEach, spentOn, taskById, type QuestStatus } from "@/lib/business-data";
import { useBusiness } from "../../../business-store";
import { PortalHeader } from "../../portal-shell";

export function QuestDetail({ id }: { id: string }) {
  const b = useBusiness();
  const router = useRouter();
  const toast = useToast();
  const c = b.campaigns.find((x) => x.id === id);

  if (!c) {
    return (
      <>
        <PortalHeader title="Quest not found" sub="It may have been deleted, or it belongs to another account." back="/business/quests" />
        <Link href="/business/quests" className="text-sm font-semibold text-lift">
          Back to Quests
        </Link>
      </>
    );
  }

  const setStatus = (status: QuestStatus) => {
    b.set((s) => ({ campaigns: s.campaigns.map((x) => (x.id === c.id ? { ...x, status } : x)) }));
    toast(status === "Paused" ? "Paused. Members can finish Quests they already started." : status === "Live" ? "Running again." : "Ended. Unused budget goes back to your balance today.");
  };

  const actions: { label: string; go: () => void }[] = [];
  if (c.status === "Live") actions.push({ label: "Pause", go: () => setStatus("Paused") }, { label: "End now", go: () => setStatus("Ended") });
  else if (c.status === "Paused") actions.push({ label: "Resume", go: () => setStatus("Live") }, { label: "End now", go: () => setStatus("Ended") });
  else if (c.status === "Draft") actions.push({ label: "Continue editing", go: () => router.push(`/business/quests/new?edit=${c.id}`) });
  actions.push({ label: "Duplicate", go: () => router.push(`/business/quests/new?copy=${c.id}`) }, { label: "Export CSV", go: () => toast(`Exported ${fmt(c.done)} completions. No personal data is included.`) });

  // Deterministic mock series: same shape on every render.
  const series = Array.from({ length: 14 }, (_, i) => (c.done ? Math.round((c.done / 14) * (0.6 + ((i * 37) % 9) / 10)) : 0));
  const sMax = Math.max(1, ...series);
  const funnel: [string, number][] = [
    ["Saw the Quest", Math.round(c.started * 3.4)],
    ["Started", c.started],
    ["Finished", Math.round(c.done * 1.06)],
    ["Verified", c.done],
  ];
  const kpis = [
    ["Verified", fmt(c.done)],
    ["Of cap", ((c.done / c.cap) * 100).toFixed(0) + "%"],
    ["Spent", naira(spentOn(c))],
    ["Cost each", naira(costEach(c.reward))],
    ["Budget left", naira((c.cap - c.done) * costEach(c.reward))],
  ];
  const info = [
    ["Reward", `✦ ${c.reward} (${naira(c.reward * SPARK_NGN)})`],
    ["Cap", `${fmt(c.cap)} completions`],
    ["Runs for", `${c.days} days`],
    ["Ends", c.ends],
    ["Status", c.status],
  ];

  return (
    <>
      <PortalHeader title={c.title} sub={`${taskById(c.task).label} · ${c.spaces.join(", ")}`} back="/business/quests">
        {actions.map((a, i) => (
          <Button key={a.label} kind={i === 0 && c.status !== "Ended" ? "primary" : "neutral"} onClick={a.go}>
            {a.label}
          </Button>
        ))}
      </PortalHeader>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-2.5">
        {kpis.map(([label, value]) => (
          <div key={label} className="flex flex-col gap-1 rounded-[14px] border border-line p-3.5">
            <span className="mono text-xl font-medium">{value}</span>
            <span className="text-xs text-muted">{label}</span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,360px),1fr))] gap-3">
        <section className="flex flex-col gap-3.5 rounded-2xl border border-line bg-card p-[18px]">
          <div className="flex justify-between gap-2.5">
            <h2 className="text-[15px] font-semibold">Completions per day</h2>
            <span className="mono text-[13px] text-muted">Last 14 days</span>
          </div>
          <div className="flex h-[140px] items-end gap-1" role="img" aria-label={`Completions per day, latest ${series[13]}`}>
            {series.map((v, i) => (
              <span key={i} title={`${v} completions`} className={i === 13 ? "min-h-0.5 flex-1 rounded-t-[3px] bg-orange" : "min-h-0.5 flex-1 rounded-t-[3px] bg-navy"} style={{ height: `${(v / sMax) * 100}%` }} />
            ))}
          </div>
          <h2 className="pt-1 text-[15px] font-semibold">From start to verified</h2>
          {funnel.map(([label, v], i) => (
            <div key={label} className="flex flex-col gap-1.5">
              <div className="flex justify-between gap-2.5 text-[13px]">
                <span>{label}</span>
                <span className="mono text-muted">
                  {fmt(v)} {i > 0 && funnel[i - 1][1] ? <span className="text-lift">{((v / funnel[i - 1][1]) * 100).toFixed(0)}%</span> : null}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-raised">
                <div className="h-full rounded-full bg-orange" style={{ width: funnel[0][1] ? `${(v / funnel[0][1]) * 100}%` : "0%" }} />
              </div>
            </div>
          ))}
        </section>
        <section className="flex flex-col gap-3 rounded-2xl border border-line bg-card p-[18px]">
          <h2 className="text-[15px] font-semibold">Completions by Space</h2>
          {c.spaces.map((n, i) => (
            <div key={n} className="flex items-center gap-2.5 text-[13px]">
              <span className="w-[150px] shrink-0">{n}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-raised">
                <div className="h-full rounded-full bg-navy" style={{ width: c.done ? `${((c.split[i] ?? 0) / c.done) * 100}%` : "0%" }} />
              </div>
              <span className="mono w-12 text-right text-muted">{fmt(c.split[i] ?? 0)}</span>
            </div>
          ))}
          <h2 className="pt-1.5 text-[15px] font-semibold">Settings</h2>
          <div className="flex flex-col">
            {info.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 border-b border-raised py-2 text-[13px]">
                <span className="text-muted">{k}</span>
                <span className="text-right">{v}</span>
              </div>
            ))}
          </div>
          <span className="text-xs leading-normal text-muted">Members are counted once per Quest. We remove completions that fail verification or look automated before you&apos;re charged.</span>
        </section>
      </div>
    </>
  );
}
