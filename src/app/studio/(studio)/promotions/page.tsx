"use client";

import { useState } from "react";

import { useToast } from "@/components/toast";
import { cx, Button } from "@/components/ui";
import { CREATOR_SHARE, ITEMS, PROMO_TYPES, type PromoType } from "@/lib/studio-data";
import { StatusPill, StudioHeader, pickClass } from "../studio-shell";
import { useStudio } from "../studio-store";

export default function PromotionsPage() {
  const st = useStudio();
  const toast = useToast();
  const [type, setType] = useState<PromoType>("launch");
  const [pct, setPct] = useState(20);
  const [itemId, setItemId] = useState("t2");
  const [code, setCode] = useState("AMARA20");

  const options = ITEMS.filter((i) => i.status !== "Draft" || i.cat === "Theme");
  const item = ITEMS.find((i) => i.id === itemId) ?? ITEMS[0];
  const price = Math.round(item.price * (1 - pct / 100));
  // One discount per item every 30 days. Deploy Friday Pack has a live code, so it's blocked.
  const recent = st.promos.some((p) => p.item === item.id);
  const launchBad = type === "launch" && item.status === "Live";
  const bad = launchBad || (type !== "launch" && recent);
  const rule = launchBad
    ? `${item.name} is already live. Launch discounts are only for items that haven't listed yet.`
    : type !== "launch" && recent
      ? `${item.name} had a discount in the last 30 days. You can discount it again from 2 Nov.`
      : "Up to 50% off. The same item can be discounted once every 30 days, so the normal price stays honest.";

  const create = () => {
    if (bad) return toast("Pick a different item or promotion type.");
    const name = type === "code" ? `${code} · ${item.name}` : `${item.name} · ${type === "launch" ? "launch" : "sale"}`;
    const when = type === "launch" ? "starts when it lists" : type === "code" ? "for 30 days" : "for 7 days from tomorrow";
    st.set((s) => ({ promos: [{ name, item: item.id, meta: `${pct}% off · ${when}`, status: "Scheduled", stats: "Not started" }, ...s.promos] }));
    toast("Promotion scheduled.");
  };

  return (
    <>
      <StudioHeader title="Promotions" sub="Launch discounts, sales and codes for your followers." />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,360px),1fr))] items-start gap-4">
        <div className="flex flex-col gap-2.5">
          {st.promos.map((p) => (
            <div key={p.name} className="flex flex-col gap-1.5 rounded-2xl border border-line bg-card p-4">
              <div className="flex items-center justify-between gap-2.5">
                <span className="text-[15px] font-semibold">{p.name}</span>
                <StatusPill status={p.status} />
              </div>
              <span className="text-[13px] text-muted">{p.meta}</span>
              <span className="mono text-xs text-muted">{p.stats}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-3.5 rounded-2xl border border-line p-[18px]">
          <span className="text-[15px] font-semibold">New promotion</span>
          <div className="flex flex-col gap-1.5" role="radiogroup" aria-label="Promotion type">
            {PROMO_TYPES.map((o) => (
              <button key={o.id} type="button" role="radio" aria-checked={type === o.id} onClick={() => setType(o.id)} className={cx("tap flex min-h-14 flex-col justify-center gap-0.5 rounded-xl border px-3.5 py-2 text-left", pickClass(type === o.id))}>
                <span className="text-sm font-semibold">{o.label}</span>
                <span className="text-xs text-muted">{o.note}</span>
              </button>
            ))}
          </div>
          <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
            Discount · {pct}% off
            <input type="range" min={10} max={50} step={5} value={pct} onChange={(e) => setPct(+e.target.value)} className="accent-orange" />
          </label>
          <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
            Item
            <select value={itemId} onChange={(e) => setItemId(e.target.value)} className="h-11 rounded-[10px] border border-line bg-ground px-3 text-sm font-normal text-ink">
              {options.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name} · {i.status}
                </option>
              ))}
            </select>
          </label>
          {type === "code" && (
            <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
              Code
              <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12))} className="mono h-11 rounded-[10px] border border-line bg-ground px-3.5 text-[15px] text-ink uppercase" />
            </label>
          )}
          <div className="flex flex-col gap-1 rounded-xl bg-raised px-3.5 py-3 text-[13px]">
            <div className="flex justify-between">
              <span className="text-muted">Buyers pay</span>
              <span className="mono">
                ✦ {price} (was ✦ {item.price})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">You keep per sale</span>
              <span className="mono">✦ {Math.round(price * CREATOR_SHARE)}</span>
            </div>
          </div>
          <span className={cx("text-xs leading-normal", bad ? "text-err" : "text-muted")}>{rule}</span>
          <Button kind="primary" className="self-start px-[18px]" onClick={create}>
            Schedule promotion
          </Button>
        </div>
      </div>
    </>
  );
}
