"use client";

import { useRouter } from "next/navigation";

import { cx, fmt } from "@/components/ui";
import { LIVE_ITEMS, SERIES, SOURCES, TOTALS_30, type Period } from "@/lib/studio-data";
import { StudioHeader, Swatch } from "./studio-shell";
import { useStudio } from "./studio-store";

export default function OverviewPage() {
  const st = useStudio();
  const router = useRouter();
  const k = st.period / 30;
  const tot = { views: Math.round(TOTALS_30.views * k), detail: Math.round(TOTALS_30.detail * k), tryons: Math.round(TOTALS_30.tryons * k), sales: Math.round(TOTALS_30.sales * k) };
  const kpis: { label: string; value: string; delta: string; gold?: boolean }[] = [
    { label: "Earned", value: "✦ " + fmt(Math.round(TOTALS_30.earned * k)), delta: `+18% on the last ${st.period} days`, gold: true },
    { label: "Sales", value: fmt(tot.sales), delta: "+12%" },
    { label: "Converts", value: ((tot.sales / tot.detail) * 100).toFixed(1) + "%", delta: "of people who open an item" },
    { label: "Refunds", value: "1.4%", delta: "Shop average is 2.1%" },
    { label: "New followers", value: fmt(Math.round(TOTALS_30.followers * k)), delta: "from your storefront" },
  ];
  const funnel: [string, number][] = [
    ["Seen in the Shop", tot.views],
    ["Opened the item", tot.detail],
    ["Tried on (themes)", tot.tryons],
    ["Bought", tot.sales],
  ];
  const series = SERIES[st.period];
  const max = Math.max(...series);
  const cols = "grid grid-cols-[2.2fr_repeat(6,1fr)] gap-2.5";

  return (
    <>
      <StudioHeader title="Overview" sub="How your items are doing across the Shop." actions />
      <div className="flex gap-1 self-start rounded-full bg-raised p-[3px]">
        {([7, 30, 90] as Period[]).map((p) => (
          <button key={p} type="button" onClick={() => st.set({ period: p })} className={cx("tap min-h-9 rounded-full px-3.5 text-[13px] font-semibold", st.period === p ? "bg-orange text-black" : "text-muted hover:text-ink")}>
            {p} days
          </button>
        ))}
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-2.5">
        {kpis.map((x) => (
          <div key={x.label} className="flex flex-col gap-1.5 rounded-[14px] border border-line bg-card p-4">
            <span className="text-[13px] text-muted">{x.label}</span>
            <span className={cx("mono text-2xl font-medium", x.gold && "text-gold-ink")}>{x.value}</span>
            <span className={cx("text-xs", x.delta.startsWith("+") ? "text-ok" : "text-muted")}>{x.delta}</span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,360px),1fr))] gap-3">
        <div className="flex flex-col gap-3.5 rounded-2xl border border-line bg-card p-[18px]">
          <span className="text-[15px] font-semibold">From browsing to buying</span>
          {funnel.map(([label, v], i) => (
            <div key={label} className="flex flex-col gap-1.5">
              <div className="flex justify-between gap-2.5 text-[13px]">
                <span>{label}</span>
                <span className="mono text-muted">
                  {fmt(v)} {i > 0 && <span className="text-lift">{((v / funnel[i - 1][1]) * 100).toFixed(0)}%</span>}
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-raised">
                <div className="h-full rounded-full bg-orange" style={{ width: `${((v / funnel[0][1]) * 100).toFixed(1)}%` }} />
              </div>
            </div>
          ))}
          <span className="text-xs leading-normal text-muted">Try-ons are people previewing a theme on their own screens before buying. Themes that are tried on sell about 4 times more often.</span>
        </div>
        <div className="flex flex-col gap-3.5 rounded-2xl border border-line bg-card p-[18px]">
          <div className="flex justify-between gap-2.5">
            <span className="text-[15px] font-semibold">Sales per day</span>
            <span className="mono text-[13px] text-muted">{fmt(tot.sales)} sales</span>
          </div>
          <div className="flex h-[140px] items-end gap-[3px]">
            {series.map((v, i) => (
              <span key={i} title={`${v} sales`} className={cx("min-h-0.5 flex-1 rounded-t-[3px]", i === series.length - 1 ? "bg-orange" : "bg-navy")} style={{ height: `${((v / max) * 100).toFixed(0)}%` }} />
            ))}
          </div>
          <span className="pt-1 text-[15px] font-semibold">Where buyers found you</span>
          {SOURCES.map(([label, p]) => (
            <div key={label} className="flex items-center gap-2.5 text-[13px]">
              <span className="w-[130px] shrink-0">{label}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-raised">
                <div className="h-full rounded-full bg-navy" style={{ width: `${p * 2.5}%` }} />
              </div>
              <span className="mono w-10 text-right text-muted">{p}%</span>
            </div>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-line">
        <div className="min-w-[720px]">
          <div className={cx(cols, "border-b border-line px-4 py-3 text-[11px] font-semibold tracking-[0.08em] text-muted uppercase")}>
            <span>Item</span>
            <span>Views</span>
            <span>Try-ons</span>
            <span>Sales</span>
            <span>Converts</span>
            <span>Refunds</span>
            <span>Rating</span>
          </div>
          {LIVE_ITEMS.map((i) => (
            <button key={i.id} type="button" onClick={() => router.push(`/studio/items/${i.id}`)} className={cx(cols, "min-h-14 w-full items-center border-b border-raised px-4 text-left text-[13px] last:border-b-0 hover:bg-card")}>
              <span className="flex min-w-0 items-center gap-2.5">
                <Swatch bg={i.swatch} glyph={i.glyph} className="h-8 w-8 rounded-[9px]" />
                <span className="flex min-w-0 flex-col">
                  <span className="truncate font-semibold">{i.name}</span>
                  <span className="text-xs text-muted">{i.cat}</span>
                </span>
              </span>
              <span className="mono">{fmt(Math.round(i.views * k))}</span>
              <span className="mono">{i.tryons ? fmt(Math.round(i.tryons * k)) : "–"}</span>
              <span className="mono">{fmt(Math.round(i.sales * k))}</span>
              <span className="mono">{((i.sales / Math.max(1, i.views)) * 100 * 3).toFixed(1)}%</span>
              <span className="mono">{i.refunds}</span>
              <span className="mono">{i.rating}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
