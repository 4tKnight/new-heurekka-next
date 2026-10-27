/** Mock data for the Web Studio. Prices are in Sparks; creators keep 80% of each sale. */

export type ItemStatus = "Live" | "In review" | "Draft";
export type ItemCat = "Theme" | "Memoji Pack" | "Persona" | "Tool Kit";

export type StudioItem = {
  id: string;
  name: string;
  cat: ItemCat;
  glyph: string;
  swatch: string;
  price: number;
  status: ItemStatus;
  views: number;
  tryons: number;
  sales: number;
  refunds: number;
  rating: string;
};

export const ITEMS: StudioItem[] = [
  { id: "t1", name: "Lagos Night", cat: "Theme", glyph: "◐", swatch: "#1FB5A8", price: 40, status: "Live", views: 4210, tryons: 880, sales: 64, refunds: 0, rating: "4.9" },
  { id: "p1", name: "Deploy Friday Pack", cat: "Memoji Pack", glyph: "☺", swatch: "#283E51", price: 40, status: "Live", views: 3880, tryons: 0, sales: 312, refunds: 2, rating: "4.8" },
  { id: "k1", name: "Mobile UI Starter Kit", cat: "Tool Kit", glyph: "⚙", swatch: "#3A4F63", price: 320, status: "Live", views: 1290, tryons: 0, sales: 41, refunds: 1, rating: "4.7" },
  { id: "p2", name: "Code Review Reactions", cat: "Memoji Pack", glyph: "✎", swatch: "#6B3A1E", price: 25, status: "Live", views: 1460, tryons: 0, sales: 97, refunds: 0, rating: "4.6" },
  { id: "p4", name: "Terminal Persona", cat: "Persona", glyph: "▮", swatch: "#1E3A2A", price: 75, status: "In review", views: 0, tryons: 0, sales: 0, refunds: 0, rating: "–" },
  { id: "t2", name: "Harmattan Haze", cat: "Theme", glyph: "◐", swatch: "#D9734E", price: 40, status: "Draft", views: 0, tryons: 0, sales: 0, refunds: 0, rating: "–" },
];

export const LIVE_ITEMS = ITEMS.filter((i) => i.status === "Live");
export const itemById = (id: string) => ITEMS.find((i) => i.id === id);

export type Period = 7 | 30 | 90;
export const SERIES: Record<Period, number[]> = {
  7: [6, 9, 5, 11, 8, 7, 10],
  30: [3, 5, 4, 6, 2, 7, 5, 4, 8, 6, 5, 9, 7, 4, 6, 8, 5, 10, 7, 6, 4, 9, 11, 6, 5, 8, 7, 9, 6, 10],
  90: Array.from({ length: 45 }, (_, i) => 4 + ((i * 7) % 9) + Math.round(i / 12)),
};

/** Totals for a 30-day period; other periods scale from these. */
export const TOTALS_30 = { views: 10840, detail: 3420, tryons: 880, sales: 214, earned: 5480, followers: 148 };

export const SOURCES: [string, number][] = [
  ["Search", 34],
  ["Trending and New", 26],
  ["Staff collections", 17],
  ["Your storefront", 15],
  ["Remixes of your work", 8],
];

export type Review = { who: string; stars: number; when: string; text: string; shot?: string };
export const REVIEWS: Record<string, Review[]> = {
  t1: [
    { who: "Chidi O.", stars: 5, when: "2d", text: "Tried it on for a day before buying. The gradient behind the Lab feed is beautiful and everything still reads fine.", shot: "linear-gradient(160deg,#0B2A3A,#24123F)" },
    { who: "Ngozi A.", stars: 5, when: "1w", text: "Light version is just as good as the dark one. Rare.", shot: "linear-gradient(160deg,#EAF4F6,#F4EEF8)" },
  ],
  p1: [
    { who: "Kofi M.", stars: 5, when: "3d", text: "The ship-it sticker lives in every release thread now." },
    { who: "Bola T.", stars: 4, when: "2w", text: "Great set. Would love a rollback one." },
  ],
  k1: [
    { who: "Ife O.", stars: 5, when: "5d", text: "Saved me a week. The 1.2 dark mode tokens are clean." },
    { who: "Seyi B.", stars: 4, when: "3w", text: "Good kit, changelog is very clear." },
  ],
};

export type VersionStatus = "Live" | "In review" | "Replaced";
export type Version = { v: string; date: string; status: VersionStatus; notes: string; files: string };
export const VERSIONS: Version[] = [
  { v: "1.2.0", date: "2 Sep", status: "Live", notes: "Dark mode tokens for every component\n14 new screens: onboarding, settings, empty states", files: "mobile-ui-kit-1.2.0.zip · 84 MB" },
  { v: "1.1.0", date: "12 Jul", status: "Replaced", notes: "Auto layout on all cards\nFixed tab bar spacing on small phones", files: "mobile-ui-kit-1.1.0.zip · 71 MB" },
  { v: "1.0.0", date: "3 May", status: "Replaced", notes: "First release", files: "mobile-ui-kit-1.0.0.zip · 62 MB" },
];

export type SplitStatus = "You" | "Accepted" | "Invite sent" | "Waiting to accept the change";
export type Split = { name: string; ini: string; pct: string; status: SplitStatus };
export const ME: Split = { name: "Amara Duke", ini: "AD", pct: "100", status: "You" };
export const SPLITS: Record<string, Split[]> = {
  p1: [{ ...ME, pct: "70" }, { name: "Kofi Mensah", ini: "KM", pct: "30", status: "Accepted" }],
  t1: [ME],
  k1: [{ ...ME, pct: "60" }, { name: "Tolu Bankole", ini: "TB", pct: "25", status: "Accepted" }, { name: "Ife Okafor", ini: "IO", pct: "15", status: "Accepted" }],
};
export const MAX_COLLABORATORS = 5;

export type Bundle = { name: string; items: string[]; price: number };
export const BUNDLES: Bundle[] = [{ name: "Developer Starter Set", items: ["p1", "p2"], price: 50 }];

export type PromoType = "launch" | "sale" | "code";
export type PromoStatus = "Live" | "Scheduled" | "Ended";
export type Promo = { name: string; item?: string; meta: string; status: PromoStatus; stats: string };
export const PROMOS: Promo[] = [
  { name: "Lagos Night · launch week", meta: "20% off for the first 72 hours after a new item lists", status: "Ended", stats: "41 sales · ✦ 1,312 earned" },
  { name: "FOLLOWERS15 · Deploy Friday Pack", item: "p1", meta: "Code for followers · 15% off · until 31 Oct", status: "Live", stats: "18 uses · ✦ 489 earned" },
];
export const PROMO_TYPES: { id: PromoType; label: string; note: string }[] = [
  { id: "launch", label: "Launch discount", note: "For a new item, for its first 72 hours in the Shop" },
  { id: "sale", label: "Sale", note: "Any live item, for up to 7 days" },
  { id: "code", label: "Follower code", note: "Only people with the code, for up to 30 days" },
];

export const BANNERS = [
  "linear-gradient(135deg,#0B2A3A,#24123F)",
  "#283E51",
  "linear-gradient(135deg,#3A1838,#5A2A1E)",
  "repeating-linear-gradient(90deg,#E83F6F55 0 8px,transparent 8px 20px),#2A1840",
  "#1E3A2A",
];

export const CREATOR = { name: "Amara Duke", ini: "AD", followers: 1904, ready: 1284, clearing: 412, nextClear: "14 Oct" };
export const CREATOR_SHARE = 0.8;
