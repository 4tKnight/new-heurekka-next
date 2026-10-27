"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { cx, fmt } from "@/components/ui";
import { ITEMS, LIVE_ITEMS, type ItemCat } from "@/lib/studio-data";
import { StatusPill, StudioHeader, Swatch, pickClass } from "../studio-shell";

const FILTERS: ("All" | ItemCat)[] = ["All", "Theme", "Memoji Pack", "Persona", "Tool Kit"];

export default function ItemsPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  return (
    <>
      <StudioHeader title="Items" sub={`${ITEMS.length} items · ${LIVE_ITEMS.length} live`} actions />
      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button key={f} type="button" onClick={() => setFilter(f)} className={cx("tap min-h-9 rounded-full border px-3.5 text-[13px]", pickClass(filter === f))}>
            {f === "All" ? "All" : f + "s"}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-3">
        {ITEMS.filter((i) => filter === "All" || i.cat === filter).map((i) => (
          <button
            key={i.id}
            type="button"
            // Draft themes open straight in the theme editor.
            onClick={() => router.push(i.status === "Draft" && i.cat === "Theme" ? "/studio/themes/editor" : `/studio/items/${i.id}`)}
            className="tap flex flex-col overflow-hidden rounded-2xl border border-line bg-card text-left hover:border-orange"
          >
            <Swatch bg={i.swatch} glyph={i.glyph} className="h-24 w-full text-[30px]" />
            <div className="flex flex-col gap-1.5 p-3.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted">{i.cat}</span>
                <StatusPill status={i.status} />
              </div>
              <span className="text-[15px] font-semibold">{i.name}</span>
              <span className="text-[13px] text-muted">
                {i.status === "Live" ? `✦ ${i.price} · ${fmt(i.sales)} sold · ★ ${i.rating}` : i.status === "Draft" ? "Not submitted yet" : "Usually reviewed within 48 hours"}
              </span>
            </div>
          </button>
        ))}
      </div>
    </>
  );
}
