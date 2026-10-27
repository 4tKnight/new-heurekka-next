import { dist, toHex, type Photo } from "@/lib/themekit";

export type Sample = { name: string; src: string };
export type AnalysedPhoto = Photo & { swatches: string[] };

type Ctx = CanvasRenderingContext2D;

const draw = (fn: (x: Ctx) => void) => {
  const c = document.createElement("canvas");
  c.width = 300;
  c.height = 520;
  fn(c.getContext("2d")!);
  return c.toDataURL("image/jpeg", 0.85);
};
const vertical = (x: Ctx, stops: [number, string][]) => {
  const g = x.createLinearGradient(0, 0, 0, 520);
  stops.forEach(([o, c]) => g.addColorStop(o, c));
  x.fillStyle = g;
  x.fillRect(0, 0, 300, 520);
};

let cached: Sample[] | null = null;

/** Three sample photos drawn on a canvas, so the prototype needs no image files. */
export function getSamples(): Sample[] {
  if (cached) return cached;
  cached = [
    {
      name: "Lagos dusk",
      src: draw((x) => {
        vertical(x, [
          [0, "#2B1055"],
          [0.55, "#C3416B"],
          [0.8, "#FF8E53"],
          [1, "#3A1E1E"],
        ]);
        x.fillStyle = "rgba(255,214,150,.9)";
        x.beginPath();
        x.arc(150, 330, 46, 0, 7);
        x.fill();
        x.fillStyle = "#1A0F1F";
        for (let i = 0; i < 14; i++) {
          const w = 14 + ((i * 37) % 22),
            h = 40 + ((i * 53) % 120);
          x.fillRect(i * 22, 460 - h, w, h + 60);
        }
      }),
    },
    {
      name: "Lekki beach",
      src: draw((x) =>
        vertical(x, [
          [0, "#9AD7EA"],
          [0.45, "#4FA9C4"],
          [0.6, "#1F6F8B"],
          [0.72, "#E9D3A3"],
          [1, "#C9A86E"],
        ]),
      ),
    },
    {
      name: "Adire",
      src: draw((x) => {
        x.fillStyle = "#1B2A6B";
        x.fillRect(0, 0, 300, 520);
        x.strokeStyle = "rgba(200,215,255,.55)";
        x.lineWidth = 3;
        for (let r = 0; r < 11; r++)
          for (let c = 0; c < 6; c++) {
            x.beginPath();
            x.arc(25 + c * 50, 25 + r * 50, 14, 0, 7);
            x.stroke();
            x.beginPath();
            x.arc(25 + c * 50, 25 + r * 50, 5, 0, 7);
            x.stroke();
          }
      }),
    },
  ];
  return cached;
}

/** Average, bright and dark colours (used by the checks) and up to five distinct swatches. */
export function analyse(src: string): Promise<AnalysedPhoto> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onerror = reject;
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = c.height = 40;
      const x = c.getContext("2d")!;
      x.drawImage(img, 0, 0, 40, 40);
      const d = x.getImageData(0, 0, 40, 40).data;
      const px: number[][] = [];
      for (let i = 0; i < d.length; i += 4) px.push([d[i], d[i + 1], d[i + 2]]);
      const L = (p: number[]) => 0.2126 * p[0] + 0.7152 * p[1] + 0.0722 * p[2];
      const sorted = [...px].sort((a, b) => L(a) - L(b));
      const avg = px.reduce((a, p) => a.map((v, i) => v + p[i] / px.length), [0, 0, 0]);
      const buckets: Record<string, { n: number; s: number[] }> = {};
      px.forEach((p) => {
        const k = p.map((v) => v >> 5).join();
        const b = (buckets[k] ??= { n: 0, s: [0, 0, 0] });
        b.n++;
        b.s = b.s.map((v, i) => v + p[i]);
      });
      const cands = Object.values(buckets)
        .sort((a, b) => b.n - a.n)
        .map((b) => toHex(b.s.map((v) => v / b.n)));
      const swatches: string[] = [];
      cands.forEach((c) => {
        if (swatches.length < 5 && swatches.every((o) => dist(o, c) > 70)) swatches.push(c);
      });
      resolve({ src, avg: toHex(avg), bright: toHex(sorted[Math.floor(px.length * 0.92)]), dark: toHex(sorted[Math.floor(px.length * 0.08)]), swatches });
    };
    img.src = src;
  });
}

/** Reads a JPG or PNG under 8 MB as a data URL, or returns why it can't. */
export function readPhoto(file: File): Promise<string> {
  if (!/image\/(png|jpeg)/.test(file.type)) return Promise.reject(new Error("Use a JPG or PNG."));
  if (file.size > 8e6) return Promise.reject(new Error("That photo is over 8 MB. Try a smaller one."));
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("Couldn't read that file."));
    r.readAsDataURL(file);
  });
}

type SoundDef = { w?: OscillatorType; f?: number[]; d?: number; v?: number; bend?: number; note: string };
export const SOUNDS: Record<string, SoundDef> = {
  Default: { w: "sine", f: [660, 880, 520], d: 0.12, v: 0.14, note: "Heurekka's own" },
  Soft: { w: "sine", f: [440, 523, 392], d: 0.22, v: 0.1, note: "Low and quiet" },
  "Talking drum": { w: "triangle", f: [190, 250, 150], d: 0.2, v: 0.22, bend: 0.55, note: "Pitch bends like a dùndún" },
  Kalimba: { w: "sine", f: [784, 1046, 659], d: 0.4, v: 0.12, note: "Bright plucked notes" },
  Arcade: { w: "square", f: [880, 1320, 660], d: 0.08, v: 0.05, note: "Short 8-bit blips" },
  Silent: { note: "No sounds" },
};

let audio: AudioContext | null = null;

/** Synthesised stand-ins for the send, cheer and join sounds (index 0, 1, 2). */
export function playSound(name: string, i: number) {
  const S = SOUNDS[name];
  if (!S?.w || !S.f || !S.d || !S.v) return;
  try {
    audio ??= new AudioContext();
    const o = audio.createOscillator(),
      g = audio.createGain(),
      t = audio.currentTime;
    o.type = S.w;
    o.frequency.setValueAtTime(S.f[i], t);
    if (S.bend) o.frequency.exponentialRampToValueAtTime(S.f[i] * S.bend, t + S.d);
    if (i === 1) o.frequency.setValueAtTime(S.f[i] * 1.26, t + S.d * 0.5);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(S.v, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + S.d);
    o.connect(g).connect(audio.destination);
    o.start(t);
    o.stop(t + S.d + 0.02);
  } catch {}
}
