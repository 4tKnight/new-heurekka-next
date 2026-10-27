"use client";

import { useToast } from "@/components/toast";
import { Toggle, cx, fmt, Button } from "@/components/ui";
import { BANNERS, CREATOR, LIVE_ITEMS, itemById } from "@/lib/studio-data";
import { StudioHeader, Swatch, pickClass } from "../studio-shell";
import { useStudio } from "../studio-store";

const MAX_FEATURED = 4;

export default function StorefrontPage() {
  const st = useStudio();
  const toast = useToast();
  const toggleFeat = (id: string) =>
    st.set((s) => ({ featured: s.featured.includes(id) ? s.featured.filter((x) => x !== id) : s.featured.length >= MAX_FEATURED ? s.featured : [...s.featured, id] }));

  return (
    <>
      <StudioHeader title="Storefront" sub="Your page in the Shop. Followers see new releases here first." />
      <div className="flex flex-wrap items-start gap-6">
        <div className="flex max-w-[560px] flex-[1_1_360px] flex-col gap-3.5">
          <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
            Bio
            <textarea value={st.bio} onChange={(e) => st.set({ bio: e.target.value.slice(0, 160) })} rows={3} className="resize-y rounded-[10px] border border-line bg-ground px-3.5 py-3 text-sm leading-normal font-normal text-ink" />
            <span className="text-xs font-normal text-muted">{st.bio.length} / 160</span>
          </label>
          <div className="flex flex-col gap-1.5">
            <span className="text-[13px] font-semibold">Banner</span>
            <div className="flex flex-wrap gap-2">
              {BANNERS.map((bg, i) => (
                <button key={i} type="button" aria-label={`Banner ${i + 1}`} aria-pressed={st.banner === i} onClick={() => st.set({ banner: i })} className={cx("h-10 w-16 rounded-[10px] outline-2 outline-offset-2", st.banner === i ? "outline-orange" : "outline-transparent")} style={{ background: bg }} />
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-[13px] font-semibold">Featured · up to 4, in this order</span>
            {LIVE_ITEMS.map((i) => {
              const n = st.featured.indexOf(i.id);
              return (
                <button key={i.id} type="button" aria-pressed={n >= 0} onClick={() => toggleFeat(i.id)} className={cx("tap flex min-h-12 items-center gap-2.5 rounded-[10px] border px-3 text-left", pickClass(n >= 0))}>
                  <span className="mono w-6 text-[13px] text-lift">{n >= 0 ? n + 1 : ""}</span>
                  <span className="flex-1 text-sm">{i.name}</span>
                  <span className="text-xs text-muted">{i.cat}</span>
                </button>
              );
            })}
          </div>
          <div className="flex min-h-14 items-center gap-3">
            <Toggle on={st.notify} onChange={(v) => st.set({ notify: v })} label="Tell followers about new releases" />
            <span className="flex flex-col gap-0.5">
              <span className="text-sm">Tell followers about new releases</span>
              <span className="text-xs text-muted">One notification per release, no more than one a week.</span>
            </span>
          </div>
          <Button kind="primary" className="self-start px-[18px]" onClick={() => toast("Storefront saved.")}>
            Save storefront
          </Button>
        </div>
        <div className="flex flex-[0_0_300px] flex-col items-center gap-2">
          <span className="text-[11px] font-semibold tracking-[0.08em] text-muted uppercase">How buyers see it</span>
          {/* Phone preview is always shown in the dark app theme. */}
          <div className="w-[300px] rounded-[38px] bg-[#1E2B37] p-[7px]">
            <div className="flex h-[560px] flex-col overflow-hidden rounded-[31px] bg-[#0E151C] text-[#E8EDF2]">
              <div className="h-24 shrink-0" style={{ background: BANNERS[st.banner] }} />
              <div className="-mt-[26px] flex flex-col gap-2 px-4">
                <span className="flex h-14 w-14 items-center justify-center rounded-full border-[3px] border-[#0E151C] bg-navy text-[17px] font-bold">{CREATOR.ini}</span>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="text-base font-bold">{CREATOR.name}</span>
                    <span className="text-[11.5px] text-[#93A3B1]">
                      Leader · <span className="mono">{fmt(CREATOR.followers)}</span> followers
                    </span>
                  </div>
                  <span className="rounded-full bg-orange px-3.5 py-[7px] text-xs font-bold text-black">Follow</span>
                </div>
                <span className="text-xs leading-normal text-[#C9D4DE]">{st.bio}</span>
                <span className="pt-1 text-[10px] font-semibold tracking-[0.08em] text-[#93A3B1] uppercase">Featured</span>
                <div className="grid grid-cols-2 gap-2">
                  {st.featured.map((id) => {
                    const i = itemById(id)!;
                    return (
                      <div key={id} className="overflow-hidden rounded-xl bg-[#16202A]">
                        <Swatch bg={i.swatch} glyph={i.glyph} className="h-[58px] w-full text-lg" />
                        <div className="flex flex-col gap-0.5 px-2 py-1.5">
                          <span className="text-[11px] font-semibold">{i.name}</span>
                          <span className="mono text-[10.5px] text-gold">✦ {i.price}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
          <button type="button" onClick={() => toast("Your storefront opens in the app Shop.")} className="text-[13px] font-semibold hover:underline">
            Open the live storefront
          </button>
        </div>
      </div>
    </>
  );
}
