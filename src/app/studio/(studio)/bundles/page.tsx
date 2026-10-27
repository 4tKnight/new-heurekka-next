"use client";

import { useState } from "react";

import { useToast } from "@/components/toast";
import { cx, Button } from "@/components/ui";
import { ITEMS, LIVE_ITEMS } from "@/lib/studio-data";
import { StudioHeader, pickClass } from "../studio-shell";
import { useStudio } from "../studio-store";

export default function BundlesPage() {
  const st = useStudio();
  const toast = useToast();
  const [name, setName] = useState("");
  const [pick, setPick] = useState<string[]>(["t1", "p1"]);
  const [rawPrice, setRawPrice] = useState(60);

  const picked = ITEMS.filter((i) => pick.includes(i.id));
  const sum = picked.reduce((a, i) => a + i.price, 0);
  // A bundle must cost at least 10% less than buying the items separately.
  const maxOk = Math.max(10, Math.round((sum * 0.9) / 5) * 5);
  const price = Math.min(rawPrice, maxOk);
  const cheapEnough = !!sum && price <= sum * 0.9;
  const valid = picked.length >= 2 && cheapEnough && name.trim().length >= 3;

  const create = () => {
    if (!valid) return toast(name.trim().length < 3 ? "Give the bundle a name." : "Check the items and price.");
    st.set((s) => ({ bundles: [...s.bundles, { name: name.trim(), items: pick, price }] }));
    setName("");
    toast("Bundle sent for review.");
  };

  return (
    <>
      <StudioHeader title="Bundles" sub="Sell several of your items together for less." />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,360px),1fr))] items-start gap-4">
        <div className="flex flex-col gap-2.5">
          {st.bundles.map((b) => {
            const its = ITEMS.filter((i) => b.items.includes(i.id));
            const total = its.reduce((a, i) => a + i.price, 0);
            return (
              <div key={b.name} className="flex flex-col gap-2 rounded-2xl border border-line bg-card p-4">
                <div className="flex justify-between gap-2.5">
                  <span className="text-[15px] font-semibold">{b.name}</span>
                  <span className="mono text-gold-ink">✦ {b.price}</span>
                </div>
                <span className="text-[13px] text-muted">{its.map((i) => i.name).join(" + ")}</span>
                <span className="text-xs text-muted">Saves {Math.round((1 - b.price / total) * 100)}% · people who own part of it pay only for the rest</span>
              </div>
            );
          })}
        </div>
        <div className="flex flex-col gap-3.5 rounded-2xl border border-line p-[18px]">
          <span className="text-[15px] font-semibold">New bundle</span>
          <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
            Name
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Night Shift Set" className="h-11 rounded-[10px] border border-line bg-ground px-3.5 text-[15px] font-normal text-ink" />
          </label>
          <div className="flex flex-col gap-1.5">
            <span className="text-[13px] font-semibold">Items · pick 2 or more</span>
            {LIVE_ITEMS.map((i) => {
              const on = pick.includes(i.id);
              return (
                <button key={i.id} type="button" role="checkbox" aria-checked={on} onClick={() => setPick(on ? pick.filter((x) => x !== i.id) : [...pick, i.id])} className={cx("tap flex min-h-12 items-center gap-2.5 rounded-[10px] border px-3 text-left", pickClass(on))}>
                  <span className={cx("flex h-5 w-5 items-center justify-center rounded-md border-2 text-xs text-black", on ? "border-orange bg-orange" : "border-line")}>{on ? "✓" : ""}</span>
                  <span className="flex-1 text-sm">{i.name}</span>
                  <span className="mono text-[13px] text-muted">✦ {i.price}</span>
                </button>
              );
            })}
          </div>
          <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
            Bundle price · ✦ {price}
            <input type="range" min={10} max={maxOk} step={5} value={price} onChange={(e) => setRawPrice(+e.target.value)} className="accent-orange" />
          </label>
          <div className="flex flex-col gap-1 rounded-xl bg-raised px-3.5 py-3 text-[13px]">
            <div className="flex justify-between">
              <span className="text-muted">Bought one by one</span>
              <span className="mono">✦ {sum}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Buyers save</span>
              <span className={cx("mono", cheapEnough ? "text-ok" : "text-err")}>{sum ? Math.round((1 - price / sum) * 100) + "%" : "–"}</span>
            </div>
          </div>
          <span className={cx("text-xs leading-normal", picked.length < 2 ? "text-err" : "text-muted")}>
            {picked.length < 2 ? "Pick at least 2 items." : "A bundle has to cost at least 10% less than buying the items one by one. Collaborators on any item are asked to approve."}
          </span>
          <Button kind="primary" className="self-start px-[18px]" onClick={create}>
            Create bundle
          </Button>
        </div>
      </div>
    </>
  );
}
