"use client";

import type { ChangeEvent, ReactNode } from "react";

import { Toggle, cx } from "@/components/ui";
import {
  FONTS,
  ICONSETS,
  RADII,
  TABS,
  css,
  lum,
  palette,
  runChecks,
  toHsl,
  type ActiveTab,
  type BgType,
  type CardStyle,
  type Check,
  type IconSet,
  type Mode,
  type MotionType,
  type PaletteKey,
  type Pattern,
  type Radius,
  type Reaction,
  type Section,
  type Theme,
} from "@/lib/themekit";
import { fontFamily } from "./fonts";
import { SOUNDS, playSound, type Sample } from "./media";

const TOKENS: [string, [PaletteKey, string, string][]][] = [
  ["Surfaces", [["ground", "Background", "Behind everything"], ["card", "Cards", "Posts, sheets and the tab bar"], ["raised", "Raised", "Chips, inputs, wells"], ["line", "Hairlines", "Card edges and dividers"]]],
  ["Text", [["ink", "Text", "Titles and body"], ["muted", "Secondary text", "Names, times and counts"]]],
  ["Action", [["accent", "Accent", "Buttons, active tab, unread. Button text picks black or white for you"], ["accentText", "Accent text", "Links and accent-coloured words"]]],
  ["Identity", [["band", "Space band", "The strip at the top of a Space"], ["mine", "Your messages", "Your DM bubbles"], ["theirs", "Their messages", "Other people's bubbles"]]],
];
/** Which check a colour token is responsible for. */
const TOKEN_CHECK: Partial<Record<PaletteKey, string>> = { ink: "card", muted: "muted", accent: "btn", accentText: "link", mine: "mine", theirs: "theirs", line: "line" };
const FIXED: [string, string][] = [
  ["#FCC02C", "Sparks"],
  ["#E05A42", "Error"],
  ["#1E8E5A", "Success"],
  ["#EE7724", "Live Buzz"],
  ["#2ECC71", "Online"],
];
const CATS = ["Dark", "Light-first", "Minimal", "Colourful", "Nature", "Culture", "Retro", "Seasonal"];
const APPBG = ["#0E151C", "#283E51", "#EE7724", "#FFFFFF", "#1FB5A8", "#E83F6F", "#39D98A", "#3D5AFE", "#2A1840", "#D9734E", "#7BC67E", "#101820"];
const HEX = /^#[0-9a-f]{6}$/i;

export type ControlsProps = {
  T: Theme;
  mode: Mode;
  section: Section;
  checks: Check[];
  up: (fn: (X: Theme) => void) => void;
  setSection: (s: Section) => void;
  samples: Sample[];
  setBgPhoto: (src: string, sample?: number) => void;
  onBgFile: (e: ChangeEvent<HTMLInputElement>) => void;
  hexEdit: Partial<Record<PaletteKey, string>>;
  setHexEdit: (k: PaletteKey, v: string) => void;
  toast: (msg: string) => void;
};

const sel = (on: boolean) => (on ? "border-orange bg-warm text-lift" : "border-line bg-transparent hover:border-muted");

function Opt({ on, onClick, children, className }: { on: boolean; onClick: () => void; children: ReactNode; className?: string }) {
  return (
    <button type="button" aria-pressed={on} onClick={onClick} className={cx("tap rounded-[10px] border text-[13px] font-semibold", sel(on), className)}>
      {children}
    </button>
  );
}
const Heading = ({ title, sub }: { title: string; sub?: string }) => (
  <div className="flex flex-col gap-1.5">
    <span className="text-xl font-bold tracking-[-0.02em]">{title}</span>
    {sub && <span className="text-[13px] leading-[1.55] text-muted">{sub}</span>}
  </div>
);
const Group = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="flex flex-col gap-2">
    <span className="text-[11px] font-semibold tracking-[0.08em] text-muted uppercase">{label}</span>
    {children}
  </div>
);
const Note = ({ children }: { children: ReactNode }) => <span className="text-xs leading-normal text-muted">{children}</span>;
const Slider = ({ label, min, max, step, value, onChange, children }: { label: string; min: number; max: number; step?: number; value: number; onChange: (v: number) => void; children?: ReactNode }) => (
  <label className="flex flex-col gap-1.5 text-[13px]">
    {label}
    <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} className="accent-orange" />
    {children}
  </label>
);

export function Controls(p: ControlsProps) {
  switch (p.section) {
    case "colours":
      return <Colours {...p} />;
    case "background":
      return <Background {...p} />;
    case "shape":
      return <Shape {...p} />;
    case "icons":
      return <Icons {...p} />;
    case "sparks":
      return <Sparks {...p} />;
    case "sounds":
      return <Sounds {...p} />;
    case "motion":
      return <Motion {...p} />;
    case "listing":
      return <Listing {...p} />;
    case "checks":
      return <Checks {...p} />;
  }
}

function Colours({ T, mode: m, checks, up, hexEdit, setHexEdit, toast }: ControlsProps) {
  const P = T.modes[m];
  const fails = checks.filter((c) => !c.pass);
  const setTok = (k: PaletteKey, v: string) => up((X) => void (X.modes[m][k] = v.toUpperCase()));
  const other: Mode = m === "dark" ? "light" : "dark";
  return (
    <>
      <Heading title={`Colours · ${m === "dark" ? "Dark" : "Light"}`} sub="Every theme ships a dark and a light version. Members get the one that matches their phone. Switch modes at the top to edit each." />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            up((X) => void (X.modes[other] = palette(X.modes[m].accent, X.hue, X.sat)[other]));
            toast(`${other === "light" ? "Light" : "Dark"} version remade from your ${m} accent.`);
          }}
          className="tap min-h-10 rounded-full border border-line px-3.5 text-[13px] font-semibold hover:border-muted"
        >
          {m === "dark" ? "Remake light from this" : "Remake dark from this"}
        </button>
        <button
          type="button"
          onClick={() =>
            up((X) => {
              const [h, sa] = toHsl(X.modes[m].accent);
              X.hue = h;
              X.sat = Math.min(45, Math.max(10, sa * 0.45));
              const np = palette(X.modes[m].accent, X.hue, X.sat)[m];
              (["ground", "card", "raised", "line", "band", "theirs"] as PaletteKey[]).forEach((k) => (X.modes[m][k] = np[k]));
            })
          }
          className="tap min-h-10 rounded-full border border-line px-3.5 text-[13px] font-semibold hover:border-muted"
        >
          Retint surfaces from accent
        </button>
      </div>
      {TOKENS.map(([title, rows]) => (
        <div key={title} className="flex flex-col gap-0.5">
          <span className="py-1.5 text-[11px] font-semibold tracking-[0.08em] text-muted uppercase">{title}</span>
          {rows.map(([k, label, help]) => {
            const f = fails.find((c) => TOKEN_CHECK[k] && c.id === TOKEN_CHECK[k] + m);
            return (
              <div key={k} className="flex min-h-[52px] items-center gap-3 border-b border-raised py-1">
                <label className="relative h-9 w-9 shrink-0 cursor-pointer overflow-hidden rounded-[10px] border border-line" style={{ background: P[k] }}>
                  <input type="color" value={P[k]} onChange={(e) => setTok(k, e.target.value)} aria-label={`${label} colour`} className="absolute inset-0 cursor-pointer opacity-0" />
                </label>
                <div className="flex flex-1 flex-col gap-px">
                  <span className="text-sm font-medium">{label}</span>
                  <span className={cx("text-xs", f ? "text-err" : "text-muted")}>{f ? `${f.label} · ${f.detail.split(" · ")[1]}` : help}</span>
                </div>
                <input
                  value={hexEdit[k] ?? P[k]}
                  maxLength={7}
                  aria-label={`${label} hex`}
                  onChange={(e) => {
                    setHexEdit(k, e.target.value);
                    if (HEX.test(e.target.value)) setTok(k, e.target.value);
                  }}
                  className="mono h-9 w-[88px] rounded-lg border border-line bg-ground px-2.5 text-[13px] text-ink"
                />
              </div>
            );
          })}
        </div>
      ))}
      <div className="flex flex-col gap-2 rounded-[14px] bg-raised p-3.5">
        <span className="text-[13px] font-semibold">Fixed by Heurekka</span>
        <div className="flex flex-wrap gap-3">
          {FIXED.map(([hex, label]) => (
            <span key={label} className="flex items-center gap-1.5 text-xs text-muted">
              <span className="h-3.5 w-3.5 rounded-full" style={{ background: hex }} />
              {label}
            </span>
          ))}
        </div>
        <Note>Sparks gold means money, and status colours mean the same thing in every theme, so no theme can change them.</Note>
      </div>
    </>
  );
}

function Background({ T, mode: m, up, samples, setBgPhoto, onBgFile }: ControlsProps) {
  const b = T.bg;
  const P = T.modes[m];
  const types: [BgType, string][] = [
    ["none", "Plain"],
    ["gradient", "Gradient"],
    ["photo", "Photo"],
    ["pattern", "Pattern"],
  ];
  const patterns: [Pattern, string][] = [
    ["dots", "Dots"],
    ["grid", "Grid"],
    ["diagonal", "Lines"],
    ["kente", "Woven"],
  ];
  return (
    <>
      <Heading title="Background" sub="Shows behind feeds, Labs and DMs. Cards and the tab bar stay solid on top, so posts are always readable." />
      <div className="grid grid-cols-4 gap-1.5">
        {types.map(([id, label]) => (
          <Opt
            key={id}
            on={b.type === id}
            className="min-h-11"
            onClick={() => {
              if (id === "photo" && !b.photo && samples[0]) return setBgPhoto(samples[0].src, 0);
              up((X) => void (X.bg.type = id));
            }}
          >
            {label}
          </Opt>
        ))}
      </div>
      {b.type === "gradient" && (
        <>
          <div className="flex flex-wrap gap-3">
            {(
              [
                ["g1", "Start"],
                ["g2", "End"],
              ] as const
            ).map(([k, label]) => (
              <label key={k} className="relative flex min-h-12 cursor-pointer items-center gap-2.5 rounded-xl border border-line px-3">
                <span className="h-7 w-7 rounded-lg" style={{ background: b[k] }} />
                <span className="text-[13px]">{label}</span>
                <span className="mono text-xs text-muted">{b[k]}</span>
                <input type="color" value={b[k]} onChange={(e) => up((X) => void (X.bg[k] = e.target.value.toUpperCase()))} aria-label={`Gradient ${label.toLowerCase()} colour`} className="absolute inset-0 cursor-pointer opacity-0" />
              </label>
            ))}
          </div>
          <Slider label={`Angle · ${b.angle}°`} min={0} max={360} value={b.angle} onChange={(v) => up((X) => void (X.bg.angle = v))} />
        </>
      )}
      {b.type === "photo" && (
        <>
          <div className="flex flex-wrap items-end gap-2.5">
            {samples.map((s, i) => (
              <button
                key={s.name}
                type="button"
                aria-label={s.name}
                onClick={() => setBgPhoto(s.src, i)}
                className={cx("h-[86px] w-14 rounded-lg bg-cover bg-center outline-2 outline-offset-2", b.sample === i ? "outline-orange" : "outline-transparent")}
                style={{ backgroundImage: `url(${s.src})` }}
              />
            ))}
            <label className="tap flex min-h-11 cursor-pointer items-center rounded-full border border-line px-4 text-[13px] font-semibold hover:border-muted">
              Upload
              <input type="file" accept="image/png,image/jpeg" onChange={onBgFile} className="hidden" />
            </label>
          </div>
          <Slider label={`Blur · ${b.blur}px`} min={0} max={20} value={b.blur} onChange={(v) => up((X) => void (X.bg.blur = v))} />
        </>
      )}
      {b.type === "pattern" && (
        <>
          <div className="grid grid-cols-4 gap-2">
            {patterns.map(([id, label]) => {
              const c = css({ ...T, bg: { ...b, type: "pattern", pattern: id, op: Math.max(b.op, 8) }, motion: { type: "none", speed: "slow" } }, m);
              return (
                <button key={id} type="button" aria-pressed={b.pattern === id} onClick={() => up((X) => void (X.bg.pattern = id))} className="flex flex-col gap-1.5">
                  <span className={cx("h-14 w-full rounded-[10px] outline-2 outline-offset-2", b.pattern === id ? "outline-orange" : "outline-transparent")} style={{ backgroundColor: P.ground, backgroundImage: c.layer, backgroundSize: c.size }} />
                  <span className="text-center text-xs text-muted">{label}</span>
                </button>
              );
            })}
          </div>
          <Slider label={`Strength · ${b.op}%`} min={2} max={14} value={b.op} onChange={(v) => up((X) => void (X.bg.op = v))} />
        </>
      )}
      {(b.type === "gradient" || b.type === "photo") && (
        <Slider label={`Shade in ${m === "dark" ? "Dark" : "Light"} · ${b.dim[m]}%`} min={0} max={95} value={b.dim[m]} onChange={(v) => up((X) => void (X.bg.dim[m] = v))}>
          <Note>Lays the background colour over the picture so titles on it stay readable. Dark and light have their own shade.</Note>
        </Slider>
      )}
    </>
  );
}

function Shape({ T, up }: ControlsProps) {
  const radii: [Radius, string][] = [
    ["sharp", "Sharp"],
    ["soft", "Soft"],
    ["round", "Round"],
  ];
  const cards: [CardStyle, string][] = [
    ["filled", "Filled"],
    ["outlined", "Outlined"],
    ["elevated", "Raised"],
  ];
  return (
    <>
      <Heading title="Shape & type" />
      <Group label="Corners">
        <div className="grid grid-cols-3 gap-2">
          {radii.map(([id, label]) => (
            <Opt key={id} on={T.radius === id} onClick={() => up((X) => void (X.radius = id))} className="flex flex-col items-center gap-2 px-2 py-3.5">
              <span className="h-[34px] w-12 border-2 border-ink" style={{ borderRadius: RADII[id].card / 2 }} />
              {label}
            </Opt>
          ))}
        </div>
      </Group>
      <Group label="Card style">
        <div className="grid grid-cols-3 gap-2">
          {cards.map(([id, label]) => (
            <Opt key={id} on={T.card === id} onClick={() => up((X) => void (X.card = id))} className="min-h-11">
              {label}
            </Opt>
          ))}
        </div>
      </Group>
      <Group label="Font">
        {FONTS.map((name) => (
          <button key={name} type="button" aria-pressed={T.font === name} onClick={() => up((X) => void (X.font = name))} className={cx("tap flex min-h-14 items-center justify-between gap-3 rounded-xl border px-3.5 py-2 text-left", sel(T.font === name))}>
            <div className="flex flex-col gap-0.5 text-ink" style={{ fontFamily: fontFamily(name) }}>
              <span className="text-base font-semibold">{name}</span>
              <span className="text-[13px] text-muted">Ẹ ku irọlẹ · ₦ 4,500 · 1,240 ✦</span>
            </div>
            <span className="text-base text-lift">{T.font === name ? "✓" : ""}</span>
          </button>
        ))}
        <Note>Every font in this set is checked by Heurekka at 15px, at 200% text size, and for ₦ and Yoruba, Igbo and Hausa letters. Counts and balances stay in DM Mono.</Note>
      </Group>
    </>
  );
}

function Icons({ T, mode: m, up }: ControlsProps) {
  const sets: [IconSet, string][] = [
    ["filled", "Filled"],
    ["outline", "Outline"],
    ["rounded", "Rounded"],
    ["pixel", "Pixel"],
    ["custom", "Upload your own"],
  ];
  const actives: [ActiveTab, string][] = [
    ["accent", "Colour"],
    ["pill", "Pill"],
    ["underline", "Underline"],
  ];
  return (
    <>
      <Heading title="Icons" />
      <Group label="Tab bar icons">
        {sets.map(([id, label]) => (
          <button key={id} type="button" aria-pressed={T.icons.set === id} onClick={() => up((X) => void (X.icons.set = id))} className={cx("tap flex min-h-[52px] items-center justify-between gap-3 rounded-xl border px-3.5", sel(T.icons.set === id))}>
            <span className="text-sm font-semibold">{label}</span>
            <span className="text-lg tracking-[8px] text-muted">{id === "custom" ? "SVG × 5" : ICONSETS[id].join("")}</span>
          </button>
        ))}
      </Group>
      {T.icons.set === "custom" && (
        <div className="flex flex-col gap-2.5 rounded-[14px] border border-dashed border-line p-3.5">
          <span className="text-[13px] leading-[1.55] text-muted">Five SVGs, one colour, drawn on a 24px grid with 2px strokes. Heurekka colours them, so they follow your accent. Each set is reviewed.</span>
          <div className="grid grid-cols-5 gap-1.5">
            {TABS.map((label, i) => {
              const done = i < T.icons.uploaded;
              return (
                <label key={label} className="flex min-h-16 cursor-pointer flex-col items-center justify-center gap-1 rounded-[10px] bg-raised text-[11px] text-muted">
                  <span className="text-lg" style={{ color: done ? T.modes[m].accentText : undefined }}>
                    {done ? "◈" : "+"}
                  </span>
                  {label}
                  <input type="file" accept=".svg,image/svg+xml" onChange={(e) => e.target.files?.[0] && up((X) => void (X.icons.uploaded = Math.max(X.icons.uploaded, i + 1)))} className="hidden" />
                </label>
              );
            })}
          </div>
        </div>
      )}
      <Group label="Active tab">
        <div className="grid grid-cols-3 gap-2">
          {actives.map(([id, label]) => (
            <Opt key={id} on={T.icons.active === id} onClick={() => up((X) => void (X.icons.active = id))} className="min-h-11">
              {label}
            </Opt>
          ))}
        </div>
      </Group>
      <Group label="App icon">
        <div className="grid grid-cols-6 gap-2">
          {APPBG.map((bg, i) => (
            <button
              key={bg}
              type="button"
              aria-label={`App icon ${i + 1}`}
              aria-pressed={T.appIcon === i}
              onClick={() => up((X) => void (X.appIcon = i))}
              className={cx("aspect-square rounded-[22%] bg-[length:58%] bg-center bg-no-repeat outline-2 outline-offset-2", T.appIcon === i ? "outline-orange" : "outline-transparent")}
              style={{ backgroundColor: bg, backgroundImage: `url(${lum(bg) > 0.4 ? "/heurekka-mark.png" : "/heurekka-mark-ondark.png"})` }}
            />
          ))}
        </div>
        <Note>iOS and Android only allow app icons that ship inside the app, so you pick from Heurekka&apos;s set. New icons arrive with app updates.</Note>
      </Group>
    </>
  );
}

function Sparks({ T, up }: ControlsProps) {
  const glyphs: [string, string][] = [
    ["✦", "Spark"],
    ["◆", "Gem"],
    ["✸", "Burst"],
    ["❖", "Diamond"],
  ];
  const reactions: [Reaction, string][] = [
    ["pill", "Filled"],
    ["outline", "Outline"],
    ["bare", "Bare"],
  ];
  return (
    <>
      <Heading title="Sparks & reactions" />
      <Group label="Sparks symbol">
        <div className="grid grid-cols-4 gap-2">
          {glyphs.map(([g, label]) => (
            <Opt key={g} on={T.sparks.glyph === g} onClick={() => up((X) => void (X.sparks.glyph = g))} className="flex min-h-16 flex-col items-center justify-center gap-1">
              <span className="mono text-[15px] text-gold">{g} 1,240</span>
              <span className="text-[11px] font-normal text-muted">{label}</span>
            </Opt>
          ))}
        </div>
        <Note>The symbol can change. The gold can&apos;t, and amounts always stay in digits.</Note>
      </Group>
      <Group label="Reactions">
        <div className="grid grid-cols-3 gap-2">
          {reactions.map(([id, label]) => (
            <Opt key={id} on={T.sparks.reaction === id} onClick={() => up((X) => void (X.sparks.reaction = id))} className="flex min-h-16 flex-col items-center justify-center gap-1.5">
              <span className={cx("rounded-full border px-2.5 py-[3px] text-[13px] font-normal text-ink", id === "pill" ? "bg-raised" : "", id === "outline" ? "border-line" : "border-transparent")}>
                🎉 <span className="mono">22</span>
              </span>
              <span className="text-xs">{label}</span>
            </Opt>
          ))}
        </div>
      </Group>
    </>
  );
}

function Sounds({ T, up }: ControlsProps) {
  return (
    <>
      <Heading title="Sounds" sub="Three moments: sending a message, a cheer on your answer, and joining a Buzz. Members can turn theme sounds off in Settings, and phones on silent stay silent." />
      {Object.entries(SOUNDS).map(([name, s]) => (
        <div key={name} className={cx("flex min-h-14 items-center gap-2.5 rounded-xl border py-1.5 pr-2 pl-3.5", sel(T.sound === name))}>
          <button
            type="button"
            aria-pressed={T.sound === name}
            onClick={() => {
              up((X) => void (X.sound = name));
              playSound(name, 0);
            }}
            className="flex flex-1 flex-col gap-px text-left"
          >
            <span className="text-sm font-semibold">{name}</span>
            <span className="text-xs text-muted">{s.note}</span>
          </button>
          {s.w &&
            ["Send", "Cheer", "Join"].map((label, i) => (
              <button key={label} type="button" aria-label={`Play ${name} ${label}`} onClick={() => playSound(name, i)} className="tap flex min-h-10 items-center gap-1 rounded-full bg-raised px-2.5 text-xs text-ink">
                ▶ {label}
              </button>
            ))}
        </div>
      ))}
      <Note>Heurekka makes every set the same loudness and keeps each sound under one second.</Note>
    </>
  );
}

function Motion({ T, up }: ControlsProps) {
  const motions: [MotionType, string, string][] = [
    ["none", "None", "Still background"],
    ["drift", "Drift", "Background moves slowly"],
    ["glow", "Glow", "A soft light breathes in a corner"],
  ];
  return (
    <>
      <Heading title="Motion" sub="Motion moves the background only. It stops when Reduce Motion or Battery Saver is on, and after 30 seconds without touching the screen." />
      <div className="grid grid-cols-3 gap-2">
        {motions.map(([id, label, note]) => (
          <Opt key={id} on={T.motion.type === id} onClick={() => up((X) => void (X.motion.type = id))} className="flex min-h-[72px] flex-col justify-center gap-1 px-3 py-2.5 text-left">
            <span className="text-sm">{label}</span>
            <span className="text-xs leading-[1.4] font-normal text-muted">{note}</span>
          </Opt>
        ))}
      </div>
      {T.motion.type !== "none" && (
        <div className="grid grid-cols-2 gap-2">
          {(["slow", "slower"] as const).map((id) => (
            <Opt key={id} on={T.motion.speed === id} onClick={() => up((X) => void (X.motion.speed = id))} className="min-h-11">
              {id === "slow" ? "Slow" : "Slower"}
            </Opt>
          ))}
        </div>
      )}
      {T.motion.type === "drift" && T.bg.type === "none" && <Note>Drift needs a gradient, photo or pattern background.</Note>}
    </>
  );
}

function Listing({ T, up }: ControlsProps) {
  const L = T.listing;
  const cut = Math.round(L.price * 0.8 * (T.remixOf ? 0.9 : 1));
  return (
    <>
      <Heading title="Listing" />
      <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
        Theme name
        <input value={T.name} onChange={(e) => up((X) => void (X.name = e.target.value.slice(0, 32)))} placeholder="Lagos Dusk" className="h-11 rounded-[10px] border border-line bg-ground px-3.5 text-[15px] font-normal text-ink" />
      </label>
      <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
        Description
        <textarea value={L.desc} onChange={(e) => up((X) => void (X.listing.desc = e.target.value.slice(0, 280)))} rows={3} placeholder="What it feels like, and where the colours came from." className="resize-y rounded-[10px] border border-line bg-ground px-3.5 py-3 text-[15px] leading-normal font-normal text-ink" />
        <span className="text-xs font-normal text-muted">{L.desc.length} / 280</span>
      </label>
      <div className="flex flex-col gap-2">
        <span className="text-[13px] font-semibold">Category</span>
        <div className="flex flex-wrap gap-1.5">
          {CATS.map((c) => (
            <button key={c} type="button" aria-pressed={L.cat === c} onClick={() => up((X) => void (X.listing.cat = c))} className={cx("tap min-h-9 rounded-full border px-3 text-[13px]", sel(L.cat === c))}>
              {c}
            </button>
          ))}
        </div>
      </div>
      <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
        Tags
        <input value={L.tags} onChange={(e) => up((X) => void (X.listing.tags = e.target.value))} placeholder="sunset, warm, lagos" className="h-11 rounded-[10px] border border-line bg-ground px-3.5 text-[15px] font-normal text-ink" />
        <span className="text-xs font-normal text-muted">Up to five, separated by commas. Buyers search and filter by these.</span>
      </label>
      <div className="flex flex-col gap-2">
        <span className="text-[13px] font-semibold">Price</span>
        <div className="flex flex-wrap gap-1.5">
          {[0, 25, 40, 60, 100].map((v) => (
            <button key={v} type="button" aria-pressed={L.price === v} onClick={() => up((X) => void (X.listing.price = v))} className={cx("tap mono min-h-10 rounded-full border px-3.5 text-[13px]", sel(L.price === v))}>
              {v ? `✦ ${v}` : "Free"}
            </button>
          ))}
        </div>
        <Note>{L.price ? `You keep ✦ ${cut} of each sale${T.remixOf ? `, after 10% to ${T.remixOf.by}` : ""}. Themes usually sell for ✦ 25–60.` : "Free themes help people find your paid ones."}</Note>
      </div>
      <div className="flex min-h-14 items-center gap-3">
        <Toggle on={L.remix} onChange={(v) => up((X) => void (X.listing.remix = v))} label="Let others remix this theme" />
        <span className="flex flex-col gap-0.5">
          <span className="text-sm">Let others remix this theme</span>
          <span className="text-xs text-muted">Remixes credit you on their listing and pay you 10% of every sale.</span>
        </span>
      </div>
      {T.remixOf && (
        <div className="rounded-xl bg-raised px-3.5 py-3 text-[13px] leading-normal">
          Remix of {T.remixOf.name} by {T.remixOf.by}. The credit shows on your listing, and {T.remixOf.by} gets 10% of each sale.
        </div>
      )}
      <Note>Add collaborators and revenue splits, or put this theme in a bundle, from Web Studio after it&apos;s approved.</Note>
    </>
  );
}

function Checks({ checks, up, setSection, toast }: ControlsProps) {
  const fails = checks.filter((c) => !c.pass);
  const fixable = fails.some((c) => c.fx);
  const rows = [...checks].sort((a, b) => Number(a.pass) - Number(b.pass));
  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-[1_1_220px] flex-col gap-1.5">
          <span className="text-xl font-bold tracking-[-0.02em]">Checks</span>
          <span className="text-[13px] leading-[1.55] text-muted">
            {fails.length ? `${fails.length} of ${checks.length} checks need fixing. You can submit once they all pass. Fix picks the nearest colour that works.` : "Everything passes in dark and light. You can submit."}
          </span>
        </div>
        {fixable && (
          <button
            type="button"
            onClick={() => {
              up((X) => {
                // A few passes, since one fix can change what another check sees.
                for (let r = 0; r < 3; r++)
                  runChecks(X)
                    .filter((c) => !c.pass && c.fx)
                    .forEach((c) => c.fx!(X));
              });
              toast("Fixed what could be fixed automatically.");
            }}
            className="tap min-h-10 rounded-full bg-orange px-4 text-[13px] font-semibold text-black hover:bg-orange-pressed"
          >
            Fix all
          </button>
        )}
      </div>
      <div className="flex flex-col">
        {rows.map((c) => (
          <div key={c.id} className="flex min-h-[52px] items-center gap-3 border-b border-raised py-1.5">
            <span className={cx("flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full text-xs font-bold", c.pass ? "bg-okbg text-ok" : "bg-error text-white")}>{c.pass ? "✓" : "!"}</span>
            <div className="flex flex-1 flex-col gap-px">
              <span className="text-sm">{c.label}</span>
              <span className="text-xs text-muted">{c.detail}</span>
            </div>
            {!c.pass && (
              <button type="button" onClick={() => (c.fx ? up((X) => c.fx!(X)) : setSection(c.sec))} className="tap min-h-9 rounded-full border border-line px-3 text-xs font-semibold text-lift hover:border-muted">
                {c.fx ? c.fixLabel : "Go there"}
              </button>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

