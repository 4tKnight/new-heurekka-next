"use client";

import type { CSSProperties, ReactNode } from "react";

import { ICONSETS, RADII, TABS, css, inkOn, make, type Mode, type Template, type Theme } from "@/lib/themekit";
import { fontFamily } from "./fonts";

export type PreviewKind = "feed" | "thread" | "dms" | "shop";

/** Everything a preview screen needs, worked out once per render. */
function tokens(T: Theme, m: Mode) {
  const P = T.modes[m],
    C = css(T, m),
    R = RADII[T.radius];
  const react = { pill: [P.raised, "transparent"], outline: ["transparent", P.line], bare: ["transparent", "transparent"] }[T.sparks.reaction];
  return {
    ...P,
    btnInk: inkOn(P.accent),
    bandInk: inkOn(P.band),
    mineInk: inkOn(P.mine),
    font: fontFamily(T.font),
    r: R,
    c: C,
    cardStyle: {
      borderRadius: R.card,
      background: P.card,
      border: T.card === "outlined" ? `1px solid ${P.line}` : "1px solid transparent",
      boxShadow: T.card === "elevated" ? (m === "dark" ? "0 6px 16px rgba(0,0,0,.45)" : "0 6px 16px rgba(16,24,32,.12)") : "none",
    } as CSSProperties,
    reactStyle: { background: react[0], border: `1px solid ${react[1]}` } as CSSProperties,
    goldBg: m === "dark" ? "#2E2717" : "#FFF3B6",
    goldInk: m === "dark" ? "#FCC02C" : "#865F00",
    glyphs: T.icons.set === "custom" ? ["◈", "◈", "◈", "◈", "◈"] : ICONSETS[T.icons.set],
  };
}
type Tk = ReturnType<typeof tokens>;

function Phone({ tk, compact, children, glow }: { tk: Tk; compact: boolean; children: ReactNode; glow?: boolean }) {
  const frame: CSSProperties = compact ? { width: "100%", padding: 0, borderRadius: 18 } : { width: 240, padding: 6, borderRadius: 34, boxShadow: "0 18px 40px rgba(0,0,0,.45)" };
  return (
    <div className="box-border shrink-0 bg-[#1E2B37]" style={frame}>
      <div className="relative overflow-hidden" style={{ height: compact ? 290 : 480, borderRadius: compact ? 18 : 28, background: tk.ground, color: tk.ink, fontFamily: tk.font }}>
        <div className="hk-motion absolute -inset-6" style={{ background: tk.c.layer, backgroundSize: tk.c.size, filter: tk.c.filter, animation: tk.c.anim }} />
        <div className="absolute inset-0" style={{ background: tk.c.shade }} />
        {glow && <div className="hk-motion absolute inset-0" style={{ background: tk.c.glow, animation: tk.c.glowAnim }} />}
        <div className="relative flex h-full flex-col">
          <div className="flex justify-between px-[18px] pt-2.5 pb-1 text-[10px] font-semibold" style={{ color: tk.muted }}>
            <span>9:41</span>
            <span>●●● ▮</span>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

const Reaction = ({ tk, children }: { tk: Tk; children: ReactNode }) => (
  <span className="rounded-full px-[7px] py-0.5 whitespace-nowrap" style={{ ...tk.reactStyle, color: tk.ink }}>
    {children}
  </span>
);

function Feed({ T, tk }: { T: Theme; tk: Tk }) {
  return (
    <>
      <div className="flex items-center gap-1.5 px-3.5 pt-1 pb-2">
        <span className="text-sm" style={{ color: tk.muted }}>
          ←
        </span>
        <span className="flex-1 text-[15px] font-bold tracking-[-0.02em]">Lab 04 · Evals</span>
        <span className="px-[9px] py-[3px] text-[10px] font-semibold" style={{ borderRadius: tk.r.chip, border: `1px solid ${tk.line}` }}>
          Joined
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 overflow-hidden px-3">
        <div className="flex flex-col gap-0.5 px-3 py-2.5" style={{ borderRadius: tk.r.card, background: tk.band, color: tk.bandInk }}>
          <span className="text-[8.5px] font-semibold tracking-[0.08em] uppercase">AI Space</span>
          <span className="text-[11px]">12 Labs · 3,402 members</span>
        </div>
        <div className="flex flex-col gap-[5px] px-3 py-2.5" style={tk.cardStyle}>
          <span className="text-[10px]" style={{ color: tk.muted }}>
            Kofi Mensah · 2h
          </span>
          <span className="text-[12.5px] leading-[1.35] font-semibold">Why does my eval score drop after quantising?</span>
          <div className="flex items-center gap-1.5 text-[10px]" style={{ color: tk.muted }}>
            <Reaction tk={tk}>🎉 22</Reaction>14 replies
          </div>
        </div>
        <div className="flex flex-col gap-[5px] px-3 py-2.5" style={tk.cardStyle}>
          <span className="text-[10px]" style={{ color: tk.muted }}>
            Amara Duke · Leader · 5h
          </span>
          <span className="text-[12.5px] leading-[1.35] font-semibold">Share your eval harness. Best one gets pinned.</span>
          <div className="flex items-center gap-1.5 text-[10px]" style={{ color: tk.muted }}>
            <Reaction tk={tk}>🔥 41</Reaction>38 replies
            <span className="ml-auto h-[7px] w-[7px] rounded-full" style={{ background: tk.accent }} />
          </div>
        </div>
      </div>
      <div className="flex justify-around px-1.5 pt-2 pb-3.5" style={{ background: tk.card, borderTop: `1px solid ${tk.line}` }}>
        {TABS.map((label, i) => {
          const on = i === 0,
            st = T.icons.active;
          return (
            <span
              key={label}
              className="flex flex-col items-center gap-0.5 rounded-full px-[7px] py-[3px]"
              style={{ color: on ? (st === "pill" ? tk.btnInk : tk.accentText) : tk.muted, background: on && st === "pill" ? tk.accent : "transparent", borderBottom: on && st === "underline" ? `2px solid ${tk.accent}` : "2px solid transparent" }}
            >
              <span className="text-[13px]">{tk.glyphs[i]}</span>
              <span className="text-[8.5px] font-semibold">{label}</span>
            </span>
          );
        })}
      </div>
    </>
  );
}

function Thread({ T, tk }: { T: Theme; tk: Tk }) {
  return (
    <>
      <div className="flex items-center gap-1.5 px-3.5 pt-1 pb-2">
        <span className="text-sm" style={{ color: tk.muted }}>
          ←
        </span>
        <span className="flex-1 text-[15px] font-bold tracking-[-0.02em]">Thread</span>
      </div>
      <div className="flex flex-1 flex-col gap-2 overflow-hidden px-3">
        <div className="flex flex-col gap-1.5 p-3" style={tk.cardStyle}>
          <span className="text-[13px] leading-[1.35] font-semibold">Why does my eval score drop after quantising?</span>
          <span className="text-[11px] leading-normal">4-bit drops accuracy 9 points on my set. 8-bit is fine.</span>
        </div>
        <div className="flex flex-col gap-1.5 px-3 py-2.5" style={tk.cardStyle}>
          <span className="text-[10px] font-semibold">
            Amara Duke{" "}
            <span className="font-normal" style={{ color: tk.muted }}>
              · 1h
            </span>
          </span>
          <span className="text-[11px] leading-normal">Check outlier channels before blaming the method.</span>
          <div className="flex items-center gap-1.5 text-[10px]">
            <Reaction tk={tk}>💡 9</Reaction>
            <span className="mono rounded-full px-2 py-0.5" style={{ background: tk.goldBg, color: tk.goldInk }}>
              {T.sparks.glyph} Tip
            </span>
          </div>
          <div className="ml-2.5 flex flex-col gap-0.5 pl-2" style={{ borderLeft: `2px solid ${tk.line}` }}>
            <span className="text-[10px] font-semibold">Kofi Mensah</span>
            <span className="text-[10.5px] leading-[1.45]">That was it. Thank you.</span>
          </div>
          <span className="text-[10.5px] font-semibold" style={{ color: tk.accentText }}>
            View 3 more replies
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 px-3 pt-2.5 pb-4" style={{ background: tk.card, borderTop: `1px solid ${tk.line}` }}>
        <span className="flex h-[30px] flex-1 items-center px-2.5 text-[10.5px]" style={{ borderRadius: tk.r.input, background: tk.raised, color: tk.muted }}>
          Reply to Amara…
        </span>
        <span className="flex h-[30px] items-center px-3 text-[11px] font-bold" style={{ borderRadius: tk.r.chip, background: tk.accent, color: tk.btnInk }}>
          Reply
        </span>
      </div>
    </>
  );
}

function Dms({ tk }: { tk: Tk }) {
  const bubble = (mine: boolean, text: string) => (
    <span className="max-w-[78%] px-2.5 py-[7px] text-[11px] leading-[1.45]" style={{ alignSelf: mine ? "flex-end" : "flex-start", borderRadius: tk.r.bubble, background: mine ? tk.mine : tk.theirs, color: mine ? tk.mineInk : tk.ink }}>
      {text}
    </span>
  );
  return (
    <>
      <div className="flex items-center gap-2 px-3.5 pt-1 pb-2.5" style={{ borderBottom: `1px solid ${tk.line}`, background: tk.card }}>
        <span className="text-sm" style={{ color: tk.muted }}>
          ←
        </span>
        <span className="relative h-[26px] w-[26px] rounded-full" style={{ background: tk.band }}>
          <span className="absolute -right-px -bottom-px h-2 w-2 rounded-full bg-presence" style={{ border: `2px solid ${tk.card}` }} />
        </span>
        <div className="flex flex-col">
          <span className="text-xs font-bold">Amara Duke</span>
          <span className="text-[9.5px]" style={{ color: tk.muted }}>
            Online
          </span>
        </div>
      </div>
      <div className="flex flex-1 flex-col justify-end gap-1.5 overflow-hidden px-3 py-2.5">
        {bubble(false, "Did the fine-tune settle?")}
        {bubble(true, "Flattened the schedule. Holding at 0.4 now.")}
        {bubble(false, "Nice. Post it in Lab 04?")}
        {bubble(true, "Doing it now 🙌")}
        <span className="self-end text-[9px]" style={{ color: tk.muted }}>
          Delivered · 9:41
        </span>
      </div>
      <div className="flex items-center gap-1.5 px-3 pt-2.5 pb-4" style={{ background: tk.card, borderTop: `1px solid ${tk.line}` }}>
        <span className="flex h-[30px] flex-1 items-center px-2.5 text-[10.5px]" style={{ borderRadius: tk.r.input, background: tk.raised, color: tk.muted }}>
          Message
        </span>
        <span className="flex h-[30px] w-[30px] items-center justify-center rounded-full text-xs font-bold" style={{ background: tk.accent, color: tk.btnInk }}>
          ↑
        </span>
      </div>
    </>
  );
}

const TILES: [string, string, string, number][] = [
  ["◐", "Theme", "Lagos Night", 40],
  ["☺", "Memoji Pack", "Deploy Friday", 40],
  ["▮", "Persona", "Terminal", 75],
  ["⚙", "Tool Kit", "Mobile UI Kit", 320],
];

function Shop({ T, tk }: { T: Theme; tk: Tk }) {
  return (
    <>
      <div className="flex items-center gap-1.5 px-3.5 pt-1 pb-2.5">
        <span className="flex-1 text-[17px] font-bold tracking-[-0.02em]">Shop</span>
        <span className="mono rounded-full px-2.5 py-1 text-[11px]" style={{ background: tk.goldBg, color: tk.goldInk }}>
          {T.sparks.glyph} 1,240
        </span>
      </div>
      <div className="grid flex-1 grid-cols-2 content-start gap-2 overflow-hidden px-3">
        {TILES.map(([glyph, cat, name, price]) => (
          <div key={name} className="flex flex-col overflow-hidden" style={tk.cardStyle}>
            <span className="flex h-[62px] items-center justify-center text-xl" style={{ background: tk.raised }}>
              {glyph}
            </span>
            <div className="flex flex-col gap-0.5 px-2 py-[7px]">
              <span className="text-[8.5px]" style={{ color: tk.muted }}>
                {cat}
              </span>
              <span className="text-[10.5px] leading-[1.3] font-semibold">{name}</span>
              <span className="mono text-[10px]" style={{ color: tk.goldInk }}>
                {T.sparks.glyph} {price}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="px-3 pt-2 pb-4">
        <span className="flex h-[34px] items-center justify-center text-xs font-bold" style={{ borderRadius: tk.r.chip, background: tk.accent, color: tk.btnInk }}>
          Browse themes
        </span>
      </div>
    </>
  );
}

/** Four real screens with the theme applied. Narrow layouts show one at a time. */
export function Previews({ T, mode, only, compact }: { T: Theme; mode: Mode; only?: PreviewKind; compact: boolean }) {
  const tk = tokens(T, mode);
  const show = (k: PreviewKind) => !only || only === k;
  return (
    <div className="flex flex-wrap justify-center gap-4">
      {show("feed") && (
        <Phone tk={tk} compact={compact} glow>
          <Feed T={T} tk={tk} />
        </Phone>
      )}
      {show("thread") && (
        <Phone tk={tk} compact={compact}>
          <Thread T={T} tk={tk} />
        </Phone>
      )}
      {show("dms") && (
        <Phone tk={tk} compact={compact}>
          <Dms tk={tk} />
        </Phone>
      )}
      {show("shop") && (
        <Phone tk={tk} compact={compact}>
          <Shop T={T} tk={tk} />
        </Phone>
      )}
    </div>
  );
}

/** Small card used on the template, remix and draft pickers. */
export function MiniCard({ t, note, onClick }: { t: Template; note?: string; onClick: () => void }) {
  const T = make(t),
    P = T.modes.dark,
    c = css(T, "dark");
  return (
    <button type="button" onClick={onClick} className="tap flex flex-col gap-2.5 rounded-2xl border border-line bg-card p-2.5 text-left hover:border-orange">
      <div className="relative h-[150px] w-full overflow-hidden rounded-xl" style={{ background: P.ground }}>
        <div className="absolute inset-0" style={{ background: c.layer, backgroundSize: c.size }} />
        <div className="absolute inset-0" style={{ background: c.shade }} />
        <div className="relative flex flex-col gap-2 p-3" style={{ fontFamily: fontFamily(T.font) }}>
          <span className="h-[22px] rounded-md" style={{ background: P.band }} />
          <div className="flex flex-col gap-1.5 p-2.5" style={{ borderRadius: RADII[T.radius].card, background: P.card }}>
            <span className="h-[7px] w-[70%] rounded" style={{ background: P.ink }} />
            <span className="h-1.5 w-[45%] rounded" style={{ background: P.muted }} />
          </div>
          <span className="self-start rounded-full px-3 py-[5px] text-[11px] font-bold" style={{ background: P.accent, color: inkOn(P.accent) }}>
            Join
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-0.5 px-1 pb-1">
        <span className="text-[15px] font-semibold">{t.name}</span>
        <span className="text-xs leading-normal text-muted">{note ?? t.note}</span>
      </div>
    </button>
  );
}
