"use client";

import Link from "next/link";

import { cx } from "@/components/ui";
import { LIVE_ITEMS, ME } from "@/lib/studio-data";
import { StudioHeader, Swatch } from "../studio-shell";
import { useStudio } from "../studio-store";

export default function CollaboratorsPage() {
  const st = useStudio();
  return (
    <>
      <StudioHeader title="Collaborators" sub="Share earnings with the people you make things with." />
      <div className="flex max-w-[820px] flex-col gap-2.5">
        {LIVE_ITEMS.map((i) => {
          const rows = st.splits[i.id] ?? [ME];
          return (
            <Link key={i.id} href={`/studio/items/${i.id}?tab=splits`} className="tap flex min-h-16 items-center gap-3.5 rounded-[14px] border border-line bg-card px-4 py-2.5 hover:border-orange">
              <Swatch bg={i.swatch} glyph={i.glyph} className="h-9 w-9 rounded-[10px]" />
              <div className="flex flex-1 flex-col gap-0.5">
                <span className="text-sm font-semibold">{i.name}</span>
                <span className="text-xs text-muted">{rows.map((r) => `${r.name.split(" ")[0]} ${r.pct}%`).join(" · ")}</span>
              </div>
              <span className={cx("text-xs", rows.length > 1 ? "text-lift" : "text-muted")}>{rows.length > 1 ? `${rows.length} people` : "Just you"}</span>
            </Link>
          );
        })}
        <span className="text-[13px] leading-[1.55] text-muted">Open an item to invite people and set shares.</span>
      </div>
    </>
  );
}
