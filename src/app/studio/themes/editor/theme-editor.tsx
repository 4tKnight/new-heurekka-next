"use client";

import { ArrowLeft } from "@phosphor-icons/react";
import Link from "next/link";
import {
  useRef,
  useState,
  useSyncExternalStore,
  type ChangeEvent,
  type ReactNode,
} from "react";

import { useToast } from "@/components/toast";
import { Mark, Toggle, cx, Button } from "@/components/ui";
import {
  FONTS,
  GOLD,
  PUBLISHED,
  TEMPLATES,
  dist,
  hsl,
  make,
  rotate,
  runChecks,
  toHsl,
  type Mode,
  type PaletteKey,
  type Section,
  type Template,
  type Theme,
} from "@/lib/themekit";
import { Controls } from "./controls";
import {
  analyse,
  getSamples,
  readPhoto,
  type AnalysedPhoto,
  type Sample,
} from "./media";
import { MiniCard, Previews, type PreviewKind } from "./previews";

type Screen =
  "start" | "templates" | "photo" | "remix" | "describe" | "edit" | "submitted";
type Version = { v: number; when: string; note: string; T: Theme };

type State = {
  screen: Screen;
  T: Theme | null;
  mode: Mode;
  section: Section;
  pv: PreviewKind;
  photo: AnalysedPhoto | null;
  photoErr: string;
  usePhotoBg: boolean;
  pickSw: number;
  sampleIdx: number;
  descText: string;
  gen: boolean;
  drafts: Template[];
  descNote: string;
  hexEdit: Partial<Record<PaletteKey, string>>;
  versions: Version[];
  saved: string;
  histOpen: boolean;
};

const SECTIONS: [Section, string][] = [
  ["colours", "Colours"],
  ["background", "Background"],
  ["shape", "Shape & type"],
  ["icons", "Icons"],
  ["sparks", "Sparks & reactions"],
  ["sounds", "Sounds"],
  ["motion", "Motion"],
  ["listing", "Listing"],
  ["checks", "Checks"],
];
const IDEAS = [
  "Lagos at dusk, warm and calm",
  "Harmattan morning, dusty and soft",
  "Retro arcade, neon on black",
  "Rainy season, deep greens",
];
const PREVIEW_TABS: [PreviewKind, string][] = [
  ["feed", "Lab"],
  ["thread", "Thread"],
  ["dms", "DMs"],
  ["shop", "Shop"],
];

const NARROW = "(max-width: 979px)";
const subscribeNarrow = (cb: () => void) => {
  const mq = window.matchMedia(NARROW);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
const NO_SAMPLES: Sample[] = [];
const noop = () => () => {};
const clone = (T: Theme): Theme => structuredClone(T);

/**
 * Drafts from a description. The prototype has no AI service, so this is the
 * design's offline fallback: hue from keywords, three different structures.
 */
function draftsFrom(text: string): Template[] {
  const t = text.toLowerCase();
  const seed = [...t].reduce((a, c) => a + c.charCodeAt(0), 0);
  const base = /dusk|sunset|warm|fire|suya/.test(t)
    ? 20
    : /green|forest|rain|leaf/.test(t)
      ? 140
      : /sea|ocean|beach|blue|water/.test(t)
        ? 195
        : /neon|arcade|retro/.test(t)
          ? 300
          : /dust|harmattan|sand/.test(t)
            ? 28
            : seed % 360;
  return [0, 1, 2].map((i) => {
    const h = (base + i * 28) % 360;
    let accent = hsl(h + 8, 72, 58);
    if (dist(accent, GOLD) < 60) accent = rotate(accent, -40);
    const bgType = (["gradient", "pattern", "none"] as const)[i];
    return {
      id: "ai" + i,
      name: ["Draft one", "Draft two", "Draft three"][i],
      note: "Drafted from your words",
      accent,
      hue: h,
      sat: 20 + i * 10,
      bg:
        bgType === "gradient"
          ? {
              type: "gradient",
              g1: hsl(h, 45, 12),
              g2: hsl(h + 40, 45, 16),
              angle: 160,
            }
          : bgType === "pattern"
            ? {
                type: "pattern",
                pattern: (["dots", "grid", "diagonal"] as const)[i],
                op: 6,
              }
            : { type: "none" },
      radius: (["soft", "round", "sharp"] as const)[i],
      font: FONTS[(seed + i) % 6],
    };
  });
}

/** `from` opens straight into editing a template, e.g. from a Studio item. */
export function ThemeEditor({ from }: { from?: string }) {
  const toast = useToast();
  const narrow = useSyncExternalStore(
    subscribeNarrow,
    () => window.matchMedia(NARROW).matches,
    () => false,
  );
  const samples = useSyncExternalStore(noop, getSamples, () => NO_SAMPLES);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [s, setS] = useState<State>(() => {
    const tpl = TEMPLATES.find((t) => t.id === from);
    const T0 = tpl ? { ...make(tpl), name: tpl.name } : null;
    return {
      screen: T0 ? "edit" : "start",
      T: T0,
      mode: "dark",
      section: "colours",
      pv: "feed",
      photo: null,
      photoErr: "",
      usePhotoBg: true,
      pickSw: 0,
      sampleIdx: -1,
      descText: "",
      gen: false,
      drafts: [],
      descNote: "",
      hexEdit: {},
      versions: T0 ? [{ v: 1, when: "Just now", note: "Opened", T: T0 }] : [],
      saved: T0 ? "Saved" : "",
      histOpen: false,
    };
  });
  const set = (patch: Partial<State> | ((p: State) => Partial<State>)) =>
    setS((p) => ({
      ...p,
      ...(typeof patch === "function" ? patch(p) : patch),
    }));

  // Drafts save as you work. Each pause becomes a version in History (last 8 kept here).
  const autosave = () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(
      () =>
        set((p) => ({
          saved: "Saved",
          versions: p.T
            ? [
                {
                  v: (p.versions[0]?.v ?? 0) + 1,
                  when: new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  }),
                  note: "Autosave",
                  T: clone(p.T),
                },
                ...p.versions,
              ].slice(0, 8)
            : p.versions,
        })),
      1200,
    );
  };
  const up = (fn: (X: Theme) => void) => {
    set((p) => {
      if (!p.T) return {};
      const T = clone(p.T);
      fn(T);
      return { T, saved: "Saving…" };
    });
    autosave();
  };
  const start = (T: Theme) =>
    set({
      T,
      screen: "edit",
      section: "colours",
      mode: "dark",
      versions: [{ v: 1, when: "Just now", note: "Started", T: clone(T) }],
      saved: "Saved",
      hexEdit: {},
    });

  const pickPhoto = async (src: string, idx = -1) => {
    const p = await analyse(src);
    const vivid = (c: string) => {
      const [, sat, l] = toHsl(c);
      return sat * (1 - Math.abs(l - 50) / 50);
    };
    let best = 0;
    p.swatches.forEach((c, i) => {
      if (vivid(c) > vivid(p.swatches[best])) best = i;
    });
    set({ photo: p, pickSw: best, photoErr: "", sampleIdx: idx });
  };
  const setBgPhoto = async (src: string, idx = -1) => {
    const p = await analyse(src);
    up((T) => {
      T.bg.type = "photo";
      T.bg.photo = { src: p.src, avg: p.avg, bright: p.bright, dark: p.dark };
      T.bg.sample = idx;
    });
  };
  const fromFile = (
    e: ChangeEvent<HTMLInputElement>,
    then: (src: string) => void,
  ) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    readPhoto(f).then(then, (err: Error) => set({ photoErr: err.message }));
  };
  const usePhoto = () => {
    const ph = s.photo;
    if (!ph) return;
    const sw = ph.swatches[s.pickSw] ?? ph.swatches[0];
    const [h, sa, l] = toHsl(sw);
    const [dh, ds] = toHsl(ph.swatches[0]);
    let accent = hsl(h, Math.max(sa, 55), Math.min(Math.max(l, 50), 65));
    if (dist(accent, GOLD) < 60) accent = rotate(accent, -36);
    start(
      make({
        id: "photo",
        name: "your photo",
        accent,
        hue: dh,
        sat: Math.min(Math.max(ds * 0.5, 8), 45),
        bg: s.usePhotoBg
          ? {
              type: "photo",
              photo: {
                src: ph.src,
                avg: ph.avg,
                bright: ph.bright,
                dark: ph.dark,
              },
              dim: { dark: 55, light: 75 },
              blur: 6,
              sample: s.sampleIdx,
            }
          : { type: "none" },
      }),
    );
  };
  const generate = () => {
    if (s.gen) return;
    if (s.descText.trim().length < 4)
      return set({
        descNote: "Describe a place, a mood or a few colours first.",
      });
    set({ gen: true, descNote: "", drafts: [] });
    setTimeout(
      () =>
        set((p) => ({
          gen: false,
          drafts: draftsFrom(p.descText.trim()),
          descNote: "Pick one to start editing. Nothing is final.",
        })),
      900,
    );
  };

  const T = s.T;
  const checks = T ? runChecks(T) : [];
  const fails = checks.filter((c) => !c.pass);
  const themeName = T ? T.name.trim() || "Untitled theme" : "New theme";
  const originLabel = !T
    ? "Theme editor"
    : T.remixOf
      ? `Remix of ${T.remixOf.name} by ${T.remixOf.by}`
      : T.origin === "blank"
        ? "Blank canvas"
        : T.origin === "photo"
          ? "From a photo"
          : T.origin.startsWith("ai")
            ? "From a description"
            : `From the ${T.originName} template`;
  const submit = () => {
    if (fails.length) {
      set({ section: "checks" });
      return toast(
        `${fails.length} ${fails.length === 1 ? "check needs" : "checks need"} fixing before you can submit.`,
      );
    }
    set({ screen: "submitted", histOpen: false });
  };
  const isEdit = s.screen === "edit" && !!T;

  return (
    <div className="flex min-h-screen flex-col bg-ground text-ink">
      <header className="flex flex-wrap items-center gap-3 border-b border-line bg-card px-[clamp(12px,2vw,20px)] py-2.5">
        <Link
          href="/studio/items"
          className="flex min-h-11 items-center gap-2 text-sm text-muted hover:text-ink"
        >
          <Mark size={24} />
          Studio
        </Link>
        <span className="h-6 w-px bg-line" />
        <div className="flex min-w-0 flex-[1_1_200px] flex-col gap-0.5">
          <span className="truncate text-base font-bold tracking-[-0.02em]">
            {themeName}
          </span>
          <span className="text-xs text-muted">{originLabel}</span>
        </div>
        {isEdit && (
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="mono text-xs text-muted" aria-live="polite">
              {s.saved}
            </span>
            <button
              type="button"
              onClick={() => set({ histOpen: !s.histOpen })}
              aria-expanded={s.histOpen}
              className="tap min-h-10 rounded-full border border-line px-3.5 text-[13px] hover:border-muted"
            >
              History
            </button>
            <div
              className="flex rounded-full bg-raised p-[3px]"
              role="radiogroup"
              aria-label="Mode"
            >
              {(["dark", "light"] as Mode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  role="radio"
                  aria-checked={s.mode === m}
                  onClick={() => set({ mode: m, hexEdit: {} })}
                  className={cx(
                    "tap min-h-[34px] rounded-full px-3.5 text-[13px] font-semibold",
                    s.mode === m
                      ? "bg-orange text-black"
                      : "text-muted hover:text-ink",
                  )}
                >
                  {m === "dark" ? "Dark" : "Light"}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => set({ section: "checks" })}
              className={cx(
                "tap min-h-10 rounded-full px-3 text-[13px] font-semibold",
                fails.length ? "bg-errbg text-err" : "bg-okbg text-ok",
              )}
            >
              {fails.length ? `${fails.length} to fix` : "All checks pass"}
            </button>
            <Button
              kind={fails.length ? "neutral" : "primary"}
              className={cx("px-[18px]", fails.length > 0 && "border-raised bg-raised text-muted")}
              onClick={submit}
            >
              Submit for review
            </Button>
          </div>
        )}
        <button
          type="button"
          onClick={() =>
            toast(
              "On your phone, open Studio, then Themes. Drafts sync both ways.",
            )
          }
          className="tap min-h-10 rounded-full border border-line px-3.5 text-[13px] font-semibold hover:border-muted"
        >
          On phone
        </button>
      </header>

      {s.histOpen && isEdit && (
        <div className="fixed top-[66px] right-4 z-20 flex w-[300px] max-w-[calc(100vw-32px)] flex-col gap-1.5 rounded-2xl border border-line bg-raised p-3.5 shadow-[0_18px_50px_rgba(0,0,0,.5)]">
          <span className="px-1 pb-1 text-[11px] font-semibold tracking-[0.08em] text-muted uppercase">
            Version history
          </span>
          {s.versions.map((v, i) => (
            <div
              key={v.v}
              className="flex min-h-11 items-center gap-2.5 rounded-[10px] px-1.5"
            >
              <span className="mono w-[34px] text-xs text-muted">v{v.v}</span>
              <div className="flex flex-1 flex-col">
                <span className="text-[13px]">{v.note}</span>
                <span className="text-xs text-muted">{v.when}</span>
              </div>
              {i === 0 ? (
                <span className="text-[13px] font-semibold text-muted">
                  Current
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    set({ T: clone(v.T), histOpen: false });
                    autosave();
                    toast(`Restored v${v.v}.`);
                  }}
                  className="text-[13px] font-semibold text-lift"
                >
                  Restore
                </button>
              )}
            </div>
          ))}
          <span className="p-1 text-xs leading-normal text-muted">
            Drafts save as you work, on web and on your phone. The last 30 days
            are kept.
          </span>
        </div>
      )}

      {s.screen === "start" && (
        <Page>
          <div className="flex flex-col gap-2">
            <h1 className="text-[30px] font-bold tracking-[-0.025em]">
              Start a theme
            </h1>
            <p className="max-w-[640px] text-[15px] leading-relaxed text-muted">
              A theme changes colours, background, shape, type, icons, Sparks
              and reactions, sounds and motion, in both dark and light. Pick a
              starting point. You can change everything after.
            </p>
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3">
            {(
              [
                [
                  "◻",
                  "Blank canvas",
                  "Heurekka's default colours with nothing else set. Build every part yourself.",
                  () =>
                    start(
                      make({ ...TEMPLATES[0], id: "blank", name: "Blank" }),
                    ),
                ],
                [
                  "▦",
                  "Start from a template",
                  "Eight starting points with different backgrounds, corners and fonts.",
                  () => set({ screen: "templates" }),
                ],
                [
                  "◑",
                  "From a photo",
                  "Upload a photo. Heurekka pulls out its colours and can use it as the background.",
                  () => set({ screen: "photo" }),
                ],
                [
                  "⟲",
                  "Remix a theme",
                  "Start from another creator's theme. They're credited and get 10% of each sale.",
                  () => set({ screen: "remix" }),
                ],
                [
                  "✎",
                  "Describe it",
                  "Write what you want in a sentence. You get three drafts to start from.",
                  () => set({ screen: "describe" }),
                ],
              ] as [string, string, string, () => void][]
            ).map(([glyph, title, body, go]) => (
              <button
                key={title}
                type="button"
                onClick={go}
                className="tap flex min-h-[150px] flex-col gap-2.5 rounded-2xl border border-line bg-card p-5 text-left hover:border-orange"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-raised text-lg text-lift">
                  {glyph}
                </span>
                <span className="text-[17px] font-semibold">{title}</span>
                <span className="text-[13px] leading-[1.55] text-muted">
                  {body}
                </span>
              </button>
            ))}
          </div>
        </Page>
      )}

      {(s.screen === "templates" ||
        s.screen === "remix" ||
        s.screen === "describe" ||
        s.screen === "photo") && (
        <Page>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Back"
              onClick={() => set({ screen: "start", drafts: [] })}
              className="tap -ml-3 flex h-11 w-11 items-center justify-center rounded-full text-muted hover:text-ink"
            >
              <ArrowLeft size={19} />
            </button>
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-bold tracking-[-0.025em]">
                {
                  {
                    templates: "Templates",
                    remix: "Remix a theme",
                    describe: "Describe it",
                    photo: "From a photo",
                  }[s.screen]
                }
              </h1>
              <span className="text-sm text-muted">
                {
                  {
                    templates:
                      "Each one is a full theme. You must change it enough to make it your own before it can be sold.",
                    remix:
                      "Only themes whose creators allow remixes are shown. Your listing credits them, and they get 10% of each sale.",
                    describe:
                      "A place, a mood, a few colours. The drafts follow every readability rule.",
                    photo:
                      "Colours come from your photo. Surfaces are kept dark or light enough to read on.",
                  }[s.screen]
                }
              </span>
            </div>
          </div>

          {s.screen === "describe" && (
            <div className="flex max-w-[680px] flex-col gap-2.5">
              <textarea
                value={s.descText}
                onChange={(e) => set({ descText: e.target.value })}
                rows={3}
                aria-label="Describe your theme"
                placeholder="Lagos at dusk. Warm, calm, a little gold light on dark water."
                className="resize-y rounded-xl border border-line bg-card px-4 py-3.5 text-[15px] leading-[1.55] text-ink"
              />
              <div className="flex flex-wrap gap-2">
                {IDEAS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => set({ descText: d })}
                    className="tap min-h-9 rounded-full bg-raised px-3 text-[13px]"
                  >
                    {d}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button kind="primary" className="px-5" loading={s.gen} onClick={generate}>
                  {s.gen
                    ? "Drafting…"
                    : s.drafts.length
                      ? "Try again"
                      : "Draft three themes"}
                </Button>
                <span className="text-[13px] text-muted">{s.descNote}</span>
              </div>
            </div>
          )}

          {s.screen === "photo" && (
            <div className="flex flex-wrap items-start gap-5">
              <div className="flex flex-[0_0_220px] flex-col gap-2.5">
                <div className="flex h-[360px] w-[220px] items-center justify-center overflow-hidden rounded-[18px] bg-raised">
                  {s.photo ? (
                    <span
                      role="img"
                      aria-label="Your photo"
                      className="h-full w-full bg-cover bg-center"
                      style={{ backgroundImage: `url(${s.photo.src})` }}
                    />
                  ) : (
                    <span className="p-5 text-center text-[13px] leading-normal text-muted">
                      JPG or PNG, up to 8 MB. Your own photo, or one you have
                      the rights to.
                    </span>
                  )}
                </div>
                <label className="tap flex min-h-11 cursor-pointer items-center justify-center rounded-full border border-line text-sm font-semibold hover:border-muted">
                  Upload photo
                  <input
                    type="file"
                    accept="image/png,image/jpeg"
                    onChange={(e) => fromFile(e, (src) => pickPhoto(src))}
                    className="hidden"
                  />
                </label>
                {s.photoErr && (
                  <span className="text-xs text-err">{s.photoErr}</span>
                )}
              </div>
              <div className="flex flex-[1_1_320px] flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <span className="text-[11px] font-semibold tracking-[0.08em] text-muted uppercase">
                    Or try a sample
                  </span>
                  <div className="flex flex-wrap gap-2.5">
                    {samples.map((p, i) => (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() => pickPhoto(p.src, i)}
                        className="flex flex-col gap-1.5"
                      >
                        <span
                          role="img"
                          aria-label={p.name}
                          className={cx(
                            "h-[110px] w-[72px] rounded-[10px] bg-cover bg-center outline-2 outline-offset-2",
                            s.sampleIdx === i
                              ? "outline-orange"
                              : "outline-transparent",
                          )}
                          style={{ backgroundImage: `url(${p.src})` }}
                        />
                        <span className="text-xs text-muted">{p.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
                {s.photo && (
                  <>
                    <div className="flex flex-col gap-2">
                      <span className="text-[11px] font-semibold tracking-[0.08em] text-muted uppercase">
                        Colours found · pick your accent
                      </span>
                      <div className="flex flex-wrap gap-2.5">
                        {s.photo.swatches.map((hex, i) => (
                          <button
                            key={hex}
                            type="button"
                            aria-pressed={s.pickSw === i}
                            onClick={() => set({ pickSw: i })}
                            className="flex flex-col items-center gap-1.5"
                          >
                            <span
                              className={cx(
                                "h-[52px] w-[52px] rounded-full outline-2 outline-offset-[3px]",
                                s.pickSw === i
                                  ? "outline-orange"
                                  : "outline-transparent",
                              )}
                              style={{ background: hex }}
                            />
                            <span className="mono text-[11px] text-muted">
                              {hex}
                            </span>
                          </button>
                        ))}
                      </div>
                      <span className="text-[13px] text-muted">
                        Surfaces are tinted from the photo&apos;s main colour.
                        Accents are made bright enough to read.
                      </span>
                    </div>
                    <div className="flex min-h-12 items-center gap-3">
                      <Toggle
                        on={s.usePhotoBg}
                        onChange={(v) => set({ usePhotoBg: v })}
                        label="Use the photo as the background too"
                      />
                      <span className="text-sm">
                        Use the photo as the background too
                      </span>
                    </div>
                    <Button kind="primary" className="self-start px-5" onClick={usePhoto}>
                      Build theme from photo
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3">
            {s.screen === "templates" &&
              TEMPLATES.map((t) => (
                <MiniCard key={t.id} t={t} onClick={() => start(make(t))} />
              ))}
            {s.screen === "remix" &&
              PUBLISHED.map((t) => (
                <MiniCard
                  key={t.id}
                  t={t}
                  note={`by ${t.by} · ${t.sales} sold`}
                  onClick={() =>
                    start(
                      make(t, {
                        remixOf: { id: t.id, name: t.name, by: t.by! },
                      }),
                    )
                  }
                />
              ))}
            {s.screen === "describe" &&
              s.drafts.map((t) => (
                <MiniCard key={t.id} t={t} onClick={() => start(make(t))} />
              ))}
          </div>
        </Page>
      )}

      {s.screen === "submitted" && T && (
        <div className="mx-auto flex w-full max-w-[620px] flex-1 flex-col items-start gap-3.5 px-5 py-[clamp(32px,6vw,72px)]">
          <Mark size={56} />
          <h1 className="text-[30px] font-bold tracking-[-0.025em]">
            {themeName} is in review.
          </h1>
          <p className="text-[15px] leading-relaxed text-muted">
            A Shop reviewer checks it within 48 hours, on real screens in dark
            and light. Shop screenshots are made from your preview, so buyers
            see exactly what they get. You&apos;ll get a notification when
            it&apos;s approved or if something needs changing.
          </p>
          <div className="flex w-full flex-col gap-2 rounded-2xl border border-line p-4">
            {[
              [
                "Price",
                `✦ ${T.listing.price} · you keep ✦ ${Math.round(T.listing.price * 0.8 * (T.remixOf ? 0.9 : 1))}`,
              ],
              [
                "Includes",
                `Dark and light, ${T.font}, ${T.bg.type === "none" ? "plain background" : T.bg.type + " background"}, ${T.sound} sounds`,
              ],
              ["Category", `${T.listing.cat} · ${T.listing.tags}`],
              [
                "Remixes",
                T.listing.remix ? "Allowed, 10% to you" : "Not allowed",
              ],
              ...(T.remixOf
                ? [["Credit", `${T.remixOf.by} gets 10% of each sale`]]
                : []),
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3 text-sm">
                <span className="text-muted">{k}</span>
                <span className="text-right">{v}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Link
              href="/studio/items"
              className="tap inline-flex min-h-11 items-center rounded-full bg-orange px-5 text-sm font-semibold text-black hover:bg-orange-pressed"
            >
              Back to Studio
            </Link>
            <button
              type="button"
              onClick={() => {
                up((X) => void (X.name = X.name + " (copy)"));
                set({ screen: "edit" });
              }}
              className="tap min-h-11 rounded-full border border-line px-5 text-sm font-semibold hover:border-muted"
            >
              Keep editing a copy
            </button>
          </div>
        </div>
      )}

      {isEdit && T && (
        <div className="flex min-h-0 flex-1 flex-wrap">
          {narrow ? (
            <div className="flex w-full gap-1.5 overflow-x-auto border-b border-line px-3 py-2.5 [scrollbar-width:none]">
              {SECTIONS.map(([id, label]) => {
                const n =
                  id === "checks"
                    ? fails.length
                    : fails.filter((c) => c.sec === id).length;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => set({ section: id })}
                    className={cx(
                      "tap flex min-h-10 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium whitespace-nowrap",
                      s.section === id ? "bg-raised text-ink" : "text-muted",
                    )}
                  >
                    {label}
                    {n > 0 && (
                      <span className="mono text-[11px] text-err">{n}</span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <nav
              className="flex h-[calc(100vh-65px)] w-[200px] shrink-0 flex-col gap-0.5 overflow-y-auto border-r border-line px-2.5 py-3.5"
              aria-label="Theme sections"
            >
              {SECTIONS.map(([id, label]) => {
                const n =
                  id === "checks"
                    ? fails.length
                    : fails.filter((c) => c.sec === id).length;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => set({ section: id })}
                    className={cx(
                      "tap flex min-h-11 items-center justify-between gap-2 rounded-[10px] px-3 text-left text-sm font-medium",
                      s.section === id
                        ? "bg-raised text-ink"
                        : "text-muted hover:text-ink",
                    )}
                  >
                    {label}
                    {n > 0 && (
                      <span className="mono flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-error px-[5px] text-[11px] text-white">
                        {n}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          )}
          <div
            className={cx(
              "flex flex-col gap-5 p-5",
              narrow
                ? "order-1 w-full"
                : "h-[calc(100vh-65px)] w-[420px] shrink-0 overflow-y-auto border-r border-line",
            )}
          >
            <Controls
              T={T}
              mode={s.mode}
              section={s.section}
              checks={checks}
              up={up}
              setSection={(section) => set({ section })}
              samples={samples}
              setBgPhoto={setBgPhoto}
              onBgFile={(e) => fromFile(e, (src) => setBgPhoto(src))}
              hexEdit={s.hexEdit}
              setHexEdit={(k, v) =>
                set((p) => ({ hexEdit: { ...p.hexEdit, [k]: v } }))
              }
              toast={toast}
            />
          </div>
          <div
            className={cx(
              "flex flex-[1_1_360px] flex-col gap-3.5 bg-desk p-5",
              !narrow && "h-[calc(100vh-65px)] overflow-y-auto",
            )}
          >
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <span className="text-[11px] font-semibold tracking-[0.08em] text-muted uppercase">
                Live preview · {s.mode === "dark" ? "Dark" : "Light"}
              </span>
              {narrow && (
                <div className="flex gap-1">
                  {PREVIEW_TABS.map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => set({ pv: id })}
                      className={cx(
                        "tap min-h-9 rounded-full px-3 text-xs font-semibold",
                        s.pv === id ? "bg-orange text-black" : "text-muted",
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Previews
              T={T}
              mode={s.mode}
              only={narrow ? s.pv : undefined}
              compact={false}
            />
            <span className="text-center text-xs text-muted">
              Real screens, your theme. What you see here is what goes to review
              and into the Shop screenshots.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

const Page = ({ children }: { children: ReactNode }) => (
  <div className="mx-auto flex w-full max-w-[1080px] flex-1 flex-col gap-[22px] px-[clamp(16px,3vw,32px)] py-[clamp(20px,4vw,48px)]">
    {children}
  </div>
);
