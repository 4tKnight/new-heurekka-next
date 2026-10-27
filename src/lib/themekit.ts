/**
 * TypeScript port of design_handoff_heurekka/design/heurekka-themekit.js, plus the
 * editor's templates and checks. The Flutter app has the same logic in
 * mobile_app/lib/core/theme_kit.dart. Keep the two in step.
 */

export type Mode = "dark" | "light";
export const MODES: Mode[] = ["dark", "light"];

export type Palette = {
  ground: string;
  card: string;
  raised: string;
  line: string;
  ink: string;
  muted: string;
  accent: string;
  accentText: string;
  band: string;
  mine: string;
  theirs: string;
};
export type PaletteKey = keyof Palette;

export type BgType = "none" | "gradient" | "photo" | "pattern";
export type Pattern = "dots" | "grid" | "diagonal" | "kente";
export type Radius = "sharp" | "soft" | "round";
export type CardStyle = "filled" | "outlined" | "elevated";
export type IconSet = "filled" | "outline" | "rounded" | "pixel" | "custom";
export type ActiveTab = "accent" | "pill" | "underline";
export type Reaction = "pill" | "outline" | "bare";
export type MotionType = "none" | "drift" | "glow";

export type Photo = { src: string; avg: string; bright: string; dark: string };

export type Bg = {
  type: BgType;
  g1: string;
  g2: string;
  angle: number;
  photo: Photo | null;
  /** Index of the bundled sample photo in use, or -1 for an upload. */
  sample?: number;
  dim: Record<Mode, number>;
  blur: number;
  pattern: Pattern;
  op: number;
};

/** Versioned theme spec, `schema: 1`, as described in the handoff README. */
export type Theme = {
  schema: 1;
  name: string;
  origin: string;
  originName: string;
  remixOf: { id: string; name: string; by: string } | null;
  hue: number;
  sat: number;
  modes: Record<Mode, Palette>;
  bg: Bg;
  radius: Radius;
  card: CardStyle;
  font: string;
  icons: { set: IconSet; active: ActiveTab; custom: boolean; uploaded: number };
  appIcon: number;
  sparks: { glyph: string; reaction: Reaction };
  sound: string;
  motion: { type: MotionType; speed: "slow" | "slower" };
  listing: { desc: string; cat: string; tags: string; price: number; remix: boolean };
};

export type Template = {
  id: string;
  name: string;
  note?: string;
  accent: string;
  hue: number;
  sat: number;
  bg?: Partial<Bg>;
  radius?: Radius;
  card?: CardStyle;
  font?: string;
  icons?: IconSet;
  motion?: MotionType;
  sound?: string;
  by?: string;
  sales?: string;
};

type RGB = [number, number, number];

export const hx = (h: string): RGB => {
  let s = String(h).replace("#", "");
  if (s.length === 3) s = s.split("").map((c) => c + c).join("");
  const n = parseInt(s, 16) || 0;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
export const toHex = (a: number[]) => "#" + a.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("").toUpperCase();
export const lum = (c: string) => {
  const a = hx(c).map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
};
export const ratio = (a: string, b: string) => {
  const x = lum(a),
    y = lum(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};
export const mix = (a: string, b: string, t: number) => {
  const A = hx(a),
    B = hx(b);
  return toHex(A.map((v, i) => v * (1 - t) + B[i] * t));
};
export const dist = (a: string, b: string) => {
  const A = hx(a),
    B = hx(b);
  return Math.hypot(A[0] - B[0], A[1] - B[1], A[2] - B[2]);
};
export const rgba = (c: string, a: number) => {
  const p = hx(c);
  return `rgba(${p[0]},${p[1]},${p[2]},${a})`;
};
export const toHsl = (c: string): [number, number, number] => {
  const [r, g, b] = hx(c).map((v) => v / 255);
  const mx = Math.max(r, g, b),
    mn = Math.min(r, g, b);
  let h = 0,
    s = 0;
  const l = (mx + mn) / 2;
  if (mx !== mn) {
    const d = mx - mn;
    s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h *= 60;
  }
  return [h, s * 100, l * 100];
};
export const hsl = (h: number, s: number, l: number) => {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(100, s)) / 100;
  l = Math.max(0, Math.min(100, l)) / 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return l - a * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1)));
  };
  return toHex([f(0) * 255, f(8) * 255, f(4) * 255]);
};
/** Black or white, whichever reads better on `c`. */
export const inkOn = (c: string) => (ratio(c, "#000000") >= ratio(c, "#FFFFFF") ? "#000000" : "#FFFFFF");
export const minR = (c: string, list: string[]) => Math.min(...list.map((b) => ratio(c, b)));
/** Moves a colour's lightness away from the background(s) until it clears the target ratio. */
export const fix = (c: string, bgs: string | string[], target: number) => {
  const list = ([] as string[]).concat(bgs);
  const [h, s, l0] = toHsl(c);
  let l = l0;
  const avg = list.reduce((a, b) => a + lum(b), 0) / list.length;
  const dir = avg > 0.18 ? -1 : 1;
  for (let i = 0; i < 60 && minR(hsl(h, s, l), list) < target; i++) l = Math.max(0, Math.min(100, l + dir * 2));
  return hsl(h, s, l);
};
export const rotate = (c: string, deg: number) => {
  const [h, s, l] = toHsl(c);
  return hsl(h + deg, s, l);
};

/** Fixed by Heurekka: no theme can change these. */
export const GOLD = "#FCC02C";
export const ERR: Record<Mode, string> = { dark: "#E05A42", light: "#C2361F" };
export const FONTS = ["DM Sans", "Manrope", "Sora", "IBM Plex Sans", "Atkinson Hyperlegible", "Bricolage Grotesque"];
export const RADII: Record<Radius, { card: number; chip: number; input: number; bubble: number }> = {
  sharp: { card: 6, chip: 6, input: 6, bubble: 8 },
  soft: { card: 16, chip: 999, input: 10, bubble: 18 },
  round: { card: 24, chip: 999, input: 18, bubble: 24 },
};
export const ICONSETS: Record<Exclude<IconSet, "custom">, string[]> = {
  filled: ["◧", "⌕", "◉", "✉", "▤"],
  outline: ["□", "○", "◎", "◇", "▢"],
  rounded: ["●", "◍", "◉", "◌", "◐"],
  pixel: ["▣", "▦", "▩", "▧", "▨"],
};
export const TABS = ["Home", "Search", "Buzz", "DMs", "Shop"];

export const palette = (accent: string, hue: number, sat: number): Record<Mode, Palette> => {
  const ah = toHsl(accent)[0];
  const dGround = hsl(hue, sat * 0.6, 7);
  const dRaised = hsl(hue, sat * 0.45, 16);
  const d: Palette = { ground: dGround, card: hsl(hue, sat * 0.5, 11), raised: dRaised, line: hsl(hue, sat * 0.4, 23), ink: hsl(hue, 18, 93), muted: hsl(hue, 12, 66), accent, band: hsl(hue, Math.min(sat + 20, 60), 26), mine: hsl(ah, 45, 30), theirs: dRaised, accentText: fix(accent, dGround, 4.5) };
  const lGround = hsl(hue, sat * 0.5, 96);
  const lRaised = hsl(hue, sat * 0.4, 91);
  const l: Palette = { ground: lGround, card: "#FFFFFF", raised: lRaised, line: hsl(hue, sat * 0.3, 84), ink: hsl(hue, 35, 9), muted: hsl(hue, 14, 36), accent, band: hsl(hue, 40, 30), mine: hsl(ah, 50, 32), theirs: lRaised, accentText: fix(accent, lGround, 4.5) };
  return { dark: d, light: l };
};

export const make = (t: Template, extra?: Partial<Theme>): Theme => ({
  schema: 1,
  name: "",
  origin: t.id,
  originName: t.name,
  remixOf: null,
  hue: t.hue,
  sat: t.sat,
  modes: palette(t.accent, t.hue, t.sat),
  bg: { type: "none", g1: "#14243A", g2: "#2A1840", angle: 160, photo: null, dim: { dark: 45, light: 70 }, blur: 0, pattern: "dots", op: 6, ...t.bg },
  radius: t.radius ?? "soft",
  card: t.card ?? "filled",
  font: t.font ?? "DM Sans",
  icons: { set: t.icons ?? "filled", active: "accent", custom: false, uploaded: 0 },
  appIcon: 0,
  sparks: { glyph: "✦", reaction: "pill" },
  sound: t.sound ?? "Default",
  motion: { type: t.motion ?? "none", speed: "slow" },
  listing: { desc: "", cat: "", tags: "", price: 40, remix: true },
  ...extra,
});

/** The colours text on the background is really seen against, after the shade. */
export const effBgs = (T: Theme, m: Mode) => {
  const P = T.modes[m],
    b = T.bg,
    t = (b.dim[m] || 0) / 100;
  if (b.type === "gradient") return [mix(b.g1, P.ground, t), mix(b.g2, P.ground, t)];
  if (b.type === "photo" && b.photo) return [b.photo.avg, b.photo.bright, b.photo.dark].map((c) => mix(c, P.ground, t));
  if (b.type === "pattern") return [mix(P.ground, P.ink, (b.op / 100) * (b.pattern === "kente" ? 1.6 : 1))];
  return [P.ground];
};

export type BgCss = { layer: string; size: string; filter: string; shade: string; anim: string; glow: string; glowAnim: string };

/** CSS for the background layer, shade and motion. Keyframes hk-drift/zoom/pan/glow live in globals.css. */
export const css = (T: Theme, m: Mode): BgCss => {
  const P = T.modes[m],
    b = T.bg,
    o = b.op / 100,
    mv = T.motion,
    slow = mv.speed === "slower" ? 2 : 1;
  const out: BgCss = { layer: "none", size: "auto", filter: "none", shade: "transparent", anim: "none", glow: "none", glowAnim: "none" };
  if (b.type === "gradient") {
    out.layer = `linear-gradient(${b.angle}deg, ${b.g1}, ${b.g2})`;
    out.size = mv.type === "drift" ? "240% 240%" : "100% 100%";
    if (mv.type === "drift") out.anim = `hk-drift ${14 * slow}s ease-in-out infinite alternate`;
  }
  if (b.type === "photo" && b.photo) {
    out.layer = `url(${b.photo.src}) center no-repeat`;
    out.size = "cover";
    out.filter = b.blur ? `blur(${b.blur}px)` : "none";
    if (mv.type === "drift") out.anim = `hk-zoom ${18 * slow}s ease-in-out infinite alternate`;
  }
  if (b.type === "pattern") {
    const c = rgba(P.ink, o);
    const patterns: Record<Pattern, [string, string]> = {
      dots: [`radial-gradient(${c} 1.2px, transparent 1.7px)`, "14px 14px"],
      grid: [`linear-gradient(${c} 1px, transparent 1px), linear-gradient(90deg, ${c} 1px, transparent 1px)`, "18px 18px, 18px 18px"],
      diagonal: [`repeating-linear-gradient(45deg, ${c} 0 2px, transparent 2px 12px)`, "auto"],
      kente: [`repeating-linear-gradient(90deg, ${rgba(P.accent, o * 1.4)} 0 8px, transparent 8px 20px), repeating-linear-gradient(0deg, ${rgba(P.band, Math.min(1, o * 4))} 0 6px, transparent 6px 22px)`, "auto, auto"],
    };
    [out.layer, out.size] = patterns[b.pattern];
    if (mv.type === "drift") out.anim = `hk-pan ${30 * slow}s linear infinite`;
  }
  if (b.type === "gradient" || b.type === "photo") out.shade = rgba(P.ground, (b.dim[m] || 0) / 100);
  if (mv.type === "glow") {
    out.glow = `radial-gradient(circle at 25% 15%, ${rgba(P.accent, 0.22)}, transparent 60%)`;
    out.glowAnim = `hk-glow ${7 * slow}s ease-in-out infinite alternate`;
  }
  return out;
};

export const TEMPLATES: Template[] = [
  { id: "heurekka", name: "Heurekka", note: "The default look. Navy-tinted dark, orange action.", accent: "#EE7724", hue: 210, sat: 30 },
  { id: "lagos", name: "Lagos Night", note: "Teal over a deep blue-violet gradient.", accent: "#1FB5A8", hue: 205, sat: 40, bg: { type: "gradient", g1: "#0B2A3A", g2: "#24123F", angle: 160 } },
  { id: "harmattan", name: "Harmattan", note: "Dusty terracotta with a fine dot texture.", accent: "#D9734E", hue: 30, sat: 22, bg: { type: "pattern", pattern: "dots", op: 6 } },
  { id: "ankara", name: "Ankara", note: "Bold pink, woven stripes, round corners.", accent: "#E83F6F", hue: 280, sat: 35, bg: { type: "pattern", pattern: "kente", op: 8 }, radius: "round", font: "Bricolage Grotesque" },
  { id: "terminal", name: "Terminal", note: "Green on near-black, sharp corners, outlined cards.", accent: "#39D98A", hue: 150, sat: 15, radius: "sharp", font: "IBM Plex Sans", card: "outlined", icons: "pixel" },
  { id: "lekki", name: "Lekki Sunset", note: "Plum to rust gradient that drifts slowly.", accent: "#F2668B", hue: 330, sat: 35, bg: { type: "gradient", g1: "#3A1838", g2: "#5A2A1E", angle: 180 }, motion: "drift" },
  { id: "forest", name: "Rainforest", note: "Leaf green on a soft grid.", accent: "#7BC67E", hue: 140, sat: 30, bg: { type: "pattern", pattern: "grid", op: 5 } },
  { id: "paper", name: "Paper", note: "Near-neutral, sharp, very easy to read.", accent: "#3D5AFE", hue: 220, sat: 8, radius: "sharp", card: "outlined", font: "Atkinson Hyperlegible", icons: "outline" },
];

/** Published themes whose creators allow remixes. */
export const PUBLISHED: Template[] = [
  { id: "r1", name: "Lagos Night", by: "Amara Duke", sales: "1.2k", accent: "#1FB5A8", hue: 205, sat: 40, bg: { type: "gradient", g1: "#0B2A3A", g2: "#24123F", angle: 160 } },
  { id: "r2", name: "Owambe", by: "Tolu Bankole", sales: "864", accent: "#C85BD6", hue: 290, sat: 40, bg: { type: "pattern", pattern: "kente", op: 9 }, radius: "round", font: "Sora" },
  { id: "r3", name: "Abuja Fog", by: "Kofi Mensah", sales: "412", accent: "#8FB3D9", hue: 210, sat: 10, card: "outlined", font: "Manrope" },
  { id: "r4", name: "Suya Smoke", by: "Ifeoma Obi", sales: "298", accent: "#F0803C", hue: 15, sat: 25, bg: { type: "pattern", pattern: "diagonal", op: 5 } },
];

export type Section = "colours" | "background" | "shape" | "icons" | "sparks" | "sounds" | "motion" | "listing" | "checks";

export type Check = {
  id: string;
  label: string;
  mode: string;
  pass: boolean;
  detail: string;
  sec: Section;
  /** Mutates a cloned theme to make the check pass. */
  fx?: (X: Theme) => void;
  fixLabel: string;
};

/** Readability, colour-role, uniqueness and listing checks, in both modes. */
export function runChecks(T: Theme): Check[] {
  const out: Check[] = [];
  for (const m of MODES) {
    const P = T.modes[m],
      M = m === "dark" ? "Dark" : "Light",
      bgs = effBgs(T, m);
    const shaded = T.bg.type === "gradient" || T.bg.type === "photo";
    const add = (id: string, label: string, val: number, target: number, sec: Section, fx: (X: Theme) => void, fixLabel = "Fix") =>
      out.push({ id: id + m, label, mode: M, pass: val >= target, detail: `${M} · ${val.toFixed(1)}:1, needs ${target}:1`, sec, fx, fixLabel });
    add(
      "bg",
      "Text on the background",
      minR(P.ink, bgs),
      4.5,
      shaded ? "background" : "colours",
      (X) => {
        if (X.bg.type === "gradient" || X.bg.type === "photo") for (let i = 0; i < 20 && minR(X.modes[m].ink, effBgs(X, m)) < 4.5; i++) X.bg.dim[m] = Math.min(95, X.bg.dim[m] + 5);
        if (minR(X.modes[m].ink, effBgs(X, m)) < 4.5) X.modes[m].ink = fix(X.modes[m].ink, effBgs(X, m), 4.5);
      },
      shaded ? "Add shade" : "Fix",
    );
    add("card", "Text on cards", ratio(P.ink, P.card), 4.5, "colours", (X) => void (X.modes[m].ink = fix(X.modes[m].ink, X.modes[m].card, 4.5)));
    add("muted", "Secondary text on cards", ratio(P.muted, P.card), 4.5, "colours", (X) => void (X.modes[m].muted = fix(X.modes[m].muted, X.modes[m].card, 4.5)));
    add("btn", "Button text on accent", ratio(inkOn(P.accent), P.accent), 4.5, "colours", (X) => void (X.modes[m].accent = fix(X.modes[m].accent, inkOn(X.modes[m].accent), 4.5)));
    add("link", "Links and accent text", ratio(P.accentText, P.card), 4.5, "colours", (X) => void (X.modes[m].accentText = fix(X.modes[m].accentText, X.modes[m].card, 4.5)));
    add("mine", "Your messages", ratio(inkOn(P.mine), P.mine), 4.5, "colours", (X) => void (X.modes[m].mine = fix(X.modes[m].mine, inkOn(X.modes[m].mine), 4.5)));
    add("theirs", "Their messages", ratio(P.ink, P.theirs), 4.5, "colours", (X) => void (X.modes[m].theirs = fix(X.modes[m].theirs, X.modes[m].ink, 4.5)));
    add("line", "Card edges visible", ratio(P.line, P.card), 1.3, "colours", (X) => void (X.modes[m].line = fix(X.modes[m].line, X.modes[m].card, 1.3)));
    const dg = dist(P.accent, GOLD);
    out.push({
      id: "gold" + m,
      label: "Accent stands apart from Sparks gold",
      mode: M,
      pass: dg >= 60,
      detail: M + (dg >= 60 ? " · clearly different" : " · too close. Gold only ever means money"),
      sec: "colours",
      fixLabel: "Shift hue",
      fx: (X) => {
        const h = toHsl(X.modes[m].accent)[0];
        for (let i = 0; i < 8 && dist(X.modes[m].accent, GOLD) < 60; i++) X.modes[m].accent = rotate(X.modes[m].accent, h > 43 ? 12 : -12);
      },
    });
    const de = dist(P.accent, ERR[m]);
    out.push({
      id: "err" + m,
      label: "Accent stands apart from error red",
      mode: M,
      pass: de >= 35,
      detail: M + (de >= 35 ? " · clearly different" : " · too close. Errors have to stand out"),
      sec: "colours",
      fixLabel: "Shift hue",
      fx: (X) => {
        for (let i = 0; i < 8 && dist(X.modes[m].accent, ERR[m]) < 35; i++) X.modes[m].accent = rotate(X.modes[m].accent, 14);
      },
    });
  }

  // Uniqueness: weighted distance on accent, ground, background type, font and corners.
  const refs = [...TEMPLATES.map((t) => ({ ...t, kind: "template" })), ...PUBLISHED.map((t) => ({ ...t, kind: "by " + t.by }))];
  let near = refs[0],
    nd = Infinity;
  for (const r of refs) {
    const g = palette(r.accent, r.hue, r.sat).dark.ground;
    const d = dist(T.modes.dark.accent, r.accent) + dist(T.modes.dark.ground, g) * 0.5 + ((r.bg?.type ?? "none") !== T.bg.type ? 60 : 0) + ((r.font ?? "DM Sans") !== T.font ? 30 : 0) + ((r.radius ?? "soft") !== T.radius ? 20 : 0);
    if (d < nd) {
      nd = d;
      near = r;
    }
  }
  out.push({
    id: "unique",
    label: "Different from themes already out there",
    mode: "Both",
    pass: nd >= 45,
    detail: nd >= 45 ? `Closest is ${near.name}, and yours is clearly its own` : `Looks almost the same as ${near.name} (${near.kind}). Change the accent, background, font or corners`,
    sec: "colours",
    fixLabel: "Shift accent",
    fx: (X) => {
      for (const m of MODES) {
        X.modes[m].accent = rotate(X.modes[m].accent, 40);
        X.modes[m].accentText = fix(X.modes[m].accent, X.modes[m].card, 4.5);
      }
    },
  });
  if (T.icons.set === "custom") out.push({ id: "icons", label: "Custom tab icons", mode: "Both", pass: T.icons.uploaded >= 5, detail: `${T.icons.uploaded} of 5 uploaded`, sec: "icons", fixLabel: "Go there" });
  const L = T.listing,
    tags = L.tags.split(",").map((t) => t.trim()).filter(Boolean);
  out.push({ id: "l1", label: "Name", mode: "Listing", pass: T.name.trim().length >= 3, detail: T.name.trim().length >= 3 ? T.name.trim() : "3 characters or more", sec: "listing", fixLabel: "Go there" });
  out.push({ id: "l2", label: "Description", mode: "Listing", pass: L.desc.trim().length >= 20, detail: L.desc.trim().length >= 20 ? "Done" : "20 characters or more", sec: "listing", fixLabel: "Go there" });
  out.push({
    id: "l3",
    label: "Category and tags",
    mode: "Listing",
    pass: !!L.cat && tags.length >= 1 && tags.length <= 5,
    detail: !L.cat ? "Pick a category" : !tags.length ? "Add at least one tag" : tags.length > 5 ? "Five tags at most" : `${L.cat} · ${tags.length} tags`,
    sec: "listing",
    fixLabel: "Go there",
  });
  return out;
}
