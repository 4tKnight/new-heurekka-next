import type { Tone } from "@/components/ui";

/**
 * Mock data for the admin prototype, from design/Heurekka-Admin.dc.html.
 * Replace with API calls once the server exists.
 */

export type Role = "Moderator" | "Finance" | "Admin";
export type CheckItem = { label: string; ok: boolean };
const OK = (label: string): CheckItem => ({ label, ok: true });
const WARN = (label: string): CheckItem => ({ label, ok: false });

export type Report = { id: string; sev: string; tone: Tone; title: string; uid: string; where: string; reporters: number; age: string; quote: string; prior: string; checks: CheckItem[] };
/** Real since Stage 5: the admin site reads these from the API. */
export const REPORTS: never[] = [];

export type ShopReview = { id: string; name: string; type: string; creator: string; uid: string; price: number; count: string; nth: string; age: string; tone: Tone; badge: string; checks: CheckItem[] };
export const SHOP: ShopReview[] = [
  { id: "s1", name: "Null Safety Stickers", type: "Memoji Pack", creator: "Ifeoma Okeke", uid: "u6", price: 25, count: "12 stickers", nth: "First pack (1 of 3 reviewed)", age: "6h", tone: "orange", badge: "First pack", checks: [OK("No image matches in the Shop"), OK("Price within limits (✦ 5–150)")] },
  { id: "s2", name: "Terminal Glow Theme", type: "Theme", creator: "Tunde Bakare", uid: "u7", price: 40, count: "1 theme, 2 variants", nth: "Second pack", age: "1d", tone: "gold", badge: "Possible copy", checks: [WARN('82% similar to "Paper Dark" by another creator'), OK("Price within limits (✦ 5–150)")] },
  { id: "s3", name: "Senior Dev Tool Kit", type: "Tool Kit", creator: "Amara Eze", uid: "u8", price: 75, count: "14 templates", nth: "First pack (1 of 3 reviewed)", age: "1d", tone: "orange", badge: "First pack", checks: [OK("No file matches in the Shop"), OK("Price within limits (✦ 5–150)")] },
];

export type QuestReview = { id: string; title: string; adv: string; verified: boolean; task: string; reward: number; cap: number; proof: string; age: string; tone: Tone; badge: string; checks: CheckItem[] };
export const QUESTS: QuestReview[] = [
  { id: "q1", title: "Finish the Flutter state management challenge", adv: "Deebug Institute", verified: true, task: "Submit a passing solution in Lab 12", reward: 30, cap: 300, proof: "Automatic (tests run in Lab)", age: "2h", tone: "green", badge: "Placement", checks: [OK("Verified business"), OK("Measurable task, checked automatically"), OK("Reward fits the effort")] },
  { id: "q2", title: "Ship a demo with the Kora Pay SDK", adv: "Kora Pay", verified: true, task: "Post a working demo link in Lab 04", reward: 30, cap: 500, proof: "Manual proof, 10% spot-checked", age: "5h", tone: "grey", badge: "Needs proof", checks: [OK("Verified business"), OK("Measurable task"), WARN("Proof needed. Completions will be spot-checked")] },
  { id: "q3", title: "Rate our app 5 stars", adv: "QuickLoan NG", verified: false, task: "Leave a 5-star store review", reward: 50, cap: 5000, proof: "Screenshot", age: "1d", tone: "red", badge: "Unverified", checks: [WARN("Business not verified"), WARN("Asks for store reviews, which isn't allowed"), WARN("Can't be checked reliably")] },
];

export type Payout = { id: string; uid: string; name: string; sparks: number; risk: string; tone: Tone; age: string; acct: string; checks: CheckItem[] };
export const PAYOUTS: Payout[] = [
  { id: "p1", uid: "u5", name: "Zanele Mahlangu", sparks: 640, risk: "Low", tone: "green", age: "3h", acct: "8 months", checks: [OK("ID, BVN and tax details verified"), OK("Earned from 31 pack sales and 4 Quests")] },
  { id: "p2", uid: "u9", name: "fastfingers", sparks: 2400, risk: "High", tone: "red", age: "40m", acct: "34 days", checks: [OK("ID verified"), WARN("312 Quest completions in 6 days"), WARN("4 accounts share this device")] },
  { id: "p3", uid: "u6", name: "Ifeoma Okeke", sparks: 310, risk: "Low", tone: "green", age: "1d", acct: "5 months", checks: [OK("ID, BVN and tax details verified"), OK("Earned from answers and Quests")] },
];

export type User = { id: string; name: string; handle: string; joined: string; sparks: number; reports: number; status: string; history: CheckItem[] };
export const USERS: User[] = [
  { id: "u1", name: "Kwame Asante", handle: "kwame_dev", joined: "Mar 2026", sparks: 210, reports: 4, status: "Active", history: [WARN("Warned for harassment · Jul"), WARN("3 new reports today")] },
  { id: "u2", name: "nullpointer_99", handle: "nullpointer_99", joined: "Jan 2026", sparks: 95, reports: 5, status: "Active", history: [WARN("5 reports on one reply · today")] },
  { id: "u3", name: "airdrop_king", handle: "airdrop_king", joined: "2 days ago", sparks: 0, reports: 2, status: "Restricted", history: [WARN("New account: no links, no DMs"), WARN("Posted same link in 6 Spaces")] },
  { id: "u4", name: "loud_lagos", handle: "loud_lagos", joined: "Jun 2026", sparks: 40, reports: 6, status: "Active", history: [WARN("Muted 7 days · Aug"), WARN("4 reports in a live Buzz · today")] },
  { id: "u5", name: "Zanele Mahlangu", handle: "zanele", joined: "Feb 2026", sparks: 640, reports: 0, status: "Trusted creator", history: [OK("6 packs listed, no rejections"), OK("Lab 04 Leader")] },
  { id: "u9", name: "fastfingers", handle: "fastfingers", joined: "34 days ago", sparks: 2400, reports: 0, status: "Active", history: [WARN("312 Quest completions in 6 days"), WARN("Device shared with 3 other accounts")] },
  { id: "u6", name: "Ifeoma Okeke", handle: "ifeoma", joined: "May 2026", sparks: 310, reports: 0, status: "Active", history: [OK("1 pack in review"), OK("ID verified")] },
  { id: "u7", name: "Tunde Bakare", handle: "tunde_b", joined: "Apr 2026", sparks: 180, reports: 0, status: "Active", history: [OK("1 pack listed"), WARN("Second pack flagged as a possible copy")] },
  { id: "u8", name: "Amara Eze", handle: "amara", joined: "Jul 2026", sparks: 75, reports: 0, status: "Active", history: [OK("1 pack in review")] },
];

export const LEDGER: Record<string, [string, number, string][]> = {
  u1: [["Reply cheered in Lab 07", 12, "2d"], ["Unlocked Paper Dark theme", -30, "1w"], ["Quest: Ask with detail", 15, "2w"]],
  u2: [["Replies cheered in Lab 07", 8, "3d"]],
  u4: [["Quest: Join the Data Space", 10, "1w"], ["Buzz tips", 30, "3w"]],
  u5: [["Pack sales: Deploy Friday Pack", 384, "this month"], ["Quest rewards", 60, "this month"], ["Cashed out ₦64,000", -400, "Aug"]],
  u6: [["Answers cheered", 190, "this month"], ["Quest rewards", 120, "this month"]],
  u7: [["Pack sales: Terminal Mono", 180, "this month"]],
  u8: [["Quest: Ship a demo", 75, "2w"]],
  u9: [["312 Quest completions", 2340, "last 6 days"], ["Replies cheered", 60, "this month"]],
};

export type Appeal = { id: string; uid: string; action: string; from: string | null; by: string; when: string; reason: string; msg: string; age: string; badge: string; tone: Tone };
/** Real since Stage 5: the admin site reads these from the API. */
export const APPEALS: never[] = [];

export type Advertiser = { id: string; name: string; reg: string; contact: string; spend: string; age: string; badge: string; tone: Tone; checks: CheckItem[] };
export const ADVERTISERS: Advertiser[] = [
  { id: "ad1", name: "Lumen Analytics", reg: "RC 2201478", contact: "growth@lumen.example", spend: "₦3,200,000 first Quest", age: "3h", badge: "Ready", tone: "green", checks: [OK("CAC registration found"), OK("Director ID matches registration"), OK("Email domain matches website"), OK("Card on file")] },
  { id: "ad2", name: "Brightpath Academy", reg: "RC 1977310", contact: "hello@brightpath.example", spend: "₦960,000 first Quest", age: "1d", badge: "Lookup pending", tone: "gold", checks: [OK("Email domain matches website"), OK("Card on file"), WARN("CAC registration lookup still pending")] },
  { id: "ad3", name: "QuickLoan NG", reg: "RC 1849203", contact: "ads@quickloan.example", spend: "₦46,000,000 first Quest", age: "1d", badge: "Docs incomplete", tone: "red", checks: [OK("CAC registration found"), WARN("Director ID doesn't match registration"), WARN("Lending license not provided"), OK("Card on file")] },
];

export type LiveSession = { id: string; title: string; uid: string; host: string; kind: "Audio" | "Video"; count: number; reports: number; started: string; badge: string; tone: Tone; checks: CheckItem[] };
export const LIVE: LiveSession[] = [
  { id: "l1", title: "Dart isolates AMA", uid: "u5", host: "Zanele Mahlangu", kind: "Audio", count: 142, reports: 4, started: "38m", badge: "4 reports", tone: "orange", checks: [WARN("loud_lagos rejoined after the host removed them"), OK("Host is a Lab Leader")] },
  { id: "l2", title: "Late-night code review", uid: "u1", host: "Kwame Asante", kind: "Video", count: 9, reports: 2, started: "1h", badge: "2 reports", tone: "red", checks: [WARN("Host has 3 new reports today"), WARN("Reports mention harassment")] },
  { id: "l3", title: "Flutter Lagos meetup stream", uid: "u7", host: "Tunde Bakare", kind: "Video", count: 61, reports: 0, started: "12m", badge: "Clear", tone: "green", checks: [OK("No reports")] },
];

export type Staff = { id: string; name: string; email: string; role: Role; twofa: boolean; last: string; week: number; pending?: boolean };
export const STAFF: Staff[] = [
  { id: "st1", name: "Efe Aigbe", email: "efe@heurekka.app", role: "Admin", twofa: true, last: "Active now", week: 14 },
  { id: "st2", name: "Adaeze Nwosu", email: "adaeze@heurekka.app", role: "Moderator", twofa: true, last: "10m ago", week: 86 },
  { id: "st3", name: "Osaze Idahosa", email: "osaze@heurekka.app", role: "Finance", twofa: true, last: "1h ago", week: 23 },
  { id: "st4", name: "Chuka Obi", email: "chuka@heurekka.app", role: "Moderator", twofa: false, last: "12 days ago", week: 0 },
];

export type SpaceRow = {
  id: string;
  name: string;
  members: number;
  labs: number;
  leaders: string[];
  suggest: string;
  open: number;
  resp: string;
  respOk: boolean;
  extra?: CheckItem[];
  archived?: boolean;
  /** Created but not public yet. */
  draft?: boolean;
  about?: string;
  topic?: string;
  visibility?: "Anyone can join" | "Request to join";
};
export const SPACE_TOPICS = ["Mobile", "Backend", "Web", "Data & AI", "Design", "Careers", "Web3", "Other"];
export const SPACES: SpaceRow[] = [
  { id: "sp1", name: "Flutter & Dart", members: 1240, labs: 9, leaders: ["Zanele Mahlangu", "Tunde Bakare"], suggest: "Ifeoma Okeke", open: 2, resp: "40m", respOk: true },
  { id: "sp2", name: "Backend", members: 860, labs: 7, leaders: ["Kemi Adeyemi"], suggest: "Amara Eze", open: 6, resp: "9h", respOk: false },
  { id: "sp3", name: "Data & AI", members: 1020, labs: 8, leaders: ["Ifeoma Okeke", "Amara Eze"], suggest: "Tunde Bakare", open: 1, resp: "1h", respOk: true },
  { id: "sp4", name: "Web3", members: 140, labs: 2, leaders: [], suggest: "Kemi Adeyemi", open: 5, resp: "2d", respOk: false, extra: [WARN("36% of posts reported as spam")] },
  { id: "sp5", name: "Web & Frontend", members: 930, labs: 6, leaders: ["Tunde Bakare", "Kemi Adeyemi"], suggest: "Amara Eze", open: 0, resp: "35m", respOk: true },
  { id: "sp6", name: "Product Design", members: 410, labs: 4, leaders: ["Amara Eze"], suggest: "Ifeoma Okeke", open: 1, resp: "2h", respOk: true },
  { id: "sp7", name: "Careers & Interviews", members: 1510, labs: 5, leaders: ["Zanele Mahlangu", "Ifeoma Okeke"], suggest: "Tunde Bakare", open: 3, resp: "1h", respOk: true },
  { id: "sp8", name: "DevOps & Cloud", members: 380, labs: 3, leaders: ["Kemi Adeyemi", "Tunde Bakare"], suggest: "Amara Eze", open: 0, resp: "50m", respOk: true },
];

export const KPIS: [string, number, number, string?][] = [
  ["Users", 3412, 5000],
  ["Monthly active users", 1180, 1000],
  ["Spaces", 64, 100],
  ["Leaders", 22, 30],
  ["Weekly retention", 37, 40, "%"],
  ["Shop items", 212, 500],
  ["Tool Kits", 41, 100],
  ["Advertisers on Quests", 9, 20],
];

/** Quest budgets in Sparks; shown in naira at the current rate. */
export const HOLDS = [
  { id: "h1", title: "Join the Data Space", adv: "Lumen Analytics", held: 23000, spent: 10120, status: "Running" },
  { id: "h2", title: "Finish the state management challenge", adv: "Deebug Institute", held: 10350, spent: 2070, status: "Running" },
  { id: "h3", title: "Ask with detail", adv: "Brightpath Academy", held: 6900, spent: 6900, status: "Cap reached" },
  { id: "h4", title: "Weekend hackathon check-in", adv: "Kora Pay", held: 17250, spent: 11040, status: "Ended" },
];

/** Payments that failed at Paystack or on our side. Amounts in naira. */
export type FailedTxn = {
  id: string;
  kind: "Sparks purchase" | "Payout" | "Refund" | "Quest card hold";
  who: string;
  uid?: string;
  amount: number;
  /** What the member or advertiser was charged or owed, when it differs from what happened. */
  detail: string;
  reason: string;
  ref: string;
  when: string;
  attempts: number;
  /** Charged but nothing delivered. These are fixed first. */
  charged?: boolean;
};
export const FAILED: FailedTxn[] = [
  { id: "f1", kind: "Sparks purchase", who: "Kwame Asante", uid: "u1", amount: 8000, detail: "✦ 50 pack", reason: "Card charged, but the confirmation webhook timed out. Sparks weren't added.", ref: "PSK-T-77310452", when: "18m", attempts: 1, charged: true },
  { id: "f2", kind: "Payout", who: "Zanele Mahlangu", uid: "u5", amount: 64000, detail: "✦ 400 cash-out", reason: "Bank rejected the transfer: account name mismatch.", ref: "PSK-TRF-2209814", when: "2h", attempts: 2 },
  { id: "f3", kind: "Sparks purchase", who: "Ifeoma Okeke", uid: "u6", amount: 3200, detail: "✦ 20 pack", reason: "Card declined by the issuing bank (insufficient funds).", ref: "PSK-T-77298811", when: "5h", attempts: 1 },
  { id: "f4", kind: "Refund", who: "Kora Pay", amount: 993600, detail: "Unspent budget: Weekend hackathon check-in", reason: "Card on file expired. Refund couldn't be returned to it.", ref: "PSK-RF-110394", when: "1d", attempts: 3 },
  { id: "f5", kind: "Quest card hold", who: "Brightpath Academy", amount: 1104000, detail: "Budget hold: Ask with detail (relaunch)", reason: "3-D Secure check not completed by the cardholder.", ref: "PSK-AUTH-558201", when: "2d", attempts: 1 },
  { id: "f6", kind: "Sparks purchase", who: "Amara Eze", uid: "u8", amount: 16000, detail: "✦ 100 pack", reason: "Charged twice for one purchase. Sparks added once.", ref: "PSK-T-77250090", when: "3d", attempts: 1, charged: true },
];

export type EconRow = { id: string; label: string; note: string; value: number; unit: string; step: number; min: number; max?: number };
export const ECON: EconRow[] = [
  { id: "rate", label: "Exchange rate", note: "Naira per Spark. Applies to Sparks earned after the change.", value: 160, unit: "₦ per ✦ 1", step: 5, min: 10 },
  { id: "fee", label: "Quest platform fee", note: "Added on top of the Quest budget as its own line.", value: 15, unit: "%", step: 1, min: 0, max: 40 },
  { id: "share", label: "Creator share of Shop sales", note: "The rest goes to Heurekka.", value: 80, unit: "%", step: 5, min: 50, max: 95 },
  { id: "min", label: "Minimum payout", note: "Smallest cash-out a creator can request.", value: 250, unit: "✦", step: 50, min: 50 },
  { id: "hold", label: "Hold before cash-out", note: "Days earned Sparks wait before they can be cashed out.", value: 14, unit: "days", step: 1, min: 0 },
  { id: "pmin", label: "Lowest Shop price", note: "Packs can't be listed below this.", value: 5, unit: "✦", step: 5, min: 5 },
  { id: "pmax", label: "Highest Shop price", note: "Packs can't be listed above this.", value: 150, unit: "✦", step: 25, min: 25 },
];

export type Cert = { id: string; uid: string; course: string; credId: string; issued: string; age: string; badge: string; tone: Tone; checks: CheckItem[] };
export const CERTS: Cert[] = [
  { id: "c1", uid: "u6", course: "Mobile Development with Flutter", credId: "DBI-2026-04817", issued: "Jun 2026", age: "2h", badge: "Match", tone: "green", checks: [OK("Credential ID found in the Deebug Institute registry"), OK("Name matches the Heurekka account")] },
  { id: "c2", uid: "u8", course: "AI for Business", credId: "DBI-2025-11902", issued: "Nov 2025", age: "6h", badge: "Name differs", tone: "gold", checks: [OK("Credential ID found in the registry"), WARN('Registry name is "Amarachi Eze", account name is "Amara Eze"')] },
  { id: "c3", uid: "u3", course: "Fullstack Web Development", credId: "DBI-2026-99999", issued: "Sep 2026", age: "1d", badge: "No match", tone: "red", checks: [WARN("Credential ID not in the registry"), WARN("Account is 2 days old")] },
];

export type DataRequest = { id: string; type: string; uid: string; from: string; filed: string; due: string; badge: string; tone: Tone; acts: "export" | "delete" | "legal"; checks: CheckItem[] };
export const DATAREQ: DataRequest[] = [
  { id: "d1", type: "Data export", uid: "u5", from: "Account owner", filed: "2d", due: "28 days left", badge: "Export", tone: "grey", acts: "export", checks: [OK("Requested from the signed-in account"), OK("Identity confirmed by email")] },
  { id: "d2", type: "Account deletion", uid: "u2", from: "Account owner", filed: "5d", due: "25 days left", badge: "Deletion", tone: "orange", acts: "delete", checks: [OK("Identity confirmed by email"), WARN("Open report on this account. Keep evidence before deleting")] },
  { id: "d3", type: "Law enforcement request", uid: "u1", from: "A state police command", filed: "1d", due: "Legal review", badge: "Legal", tone: "red", acts: "legal", checks: [WARN("No data is shared without a valid court order"), WARN("Only Admins with legal sign-off can respond")] },
];

export const REACH: Record<string, number> = { "All members": 3412, Creators: 286, Leaders: 22, Advertisers: 9, "Flutter & Dart Space": 1240 };

export type Announcement = { id: string; title: string; aud: string; ch: string; when: string; reach: string };
export const SENT: Announcement[] = [
  { id: "m1", title: "Sparks can now be cashed out", aud: "Creators", ch: "In-app · Email", when: "Oct 1", reach: "286 · 71% opened" },
  { id: "m2", title: "Scheduled maintenance Sunday 02:00 WAT", aud: "All members", ch: "In-app", when: "Sep 26", reach: "3,104 · 58% seen" },
];

export type Rule = { id: string; label: string; note: string; value: number; unit: string; step: number; on: boolean };
export const RULES: Rule[] = [
  { id: "links", label: "No links from new accounts", note: "Accounts younger than this can't post links.", value: 3, unit: "days", step: 1, on: true },
  { id: "dms", label: "No DMs to strangers from new accounts", note: "Only connections can be messaged during this window.", value: 2, unit: "days", step: 1, on: true },
  { id: "rate", label: "Thread posting limit", note: "Per member, per hour.", value: 5, unit: "/ hour", step: 1, on: true },
  { id: "hide", label: "Auto-hide after trusted reports", note: "Hidden until a moderator reviews it.", value: 3, unit: "reports", step: 1, on: true },
  { id: "shop", label: "Pre-review new creators' packs", note: "After this many approvals, creators list right away.", value: 3, unit: "packs", step: 1, on: true },
  { id: "risk", label: "Hold risky cash-outs", note: "Payouts above this risk score wait for finance review.", value: 70, unit: "score", step: 5, on: true },
];

export type AuditEntry = { id: string; time: string; who: string; what: string; target: string };
export const AUDIT: AuditEntry[] = [
  { id: "a1", time: "09:12", who: "Adaeze N. (Moderator)", what: "Removed content", target: "Spam thread in Lab 02" },
  { id: "a2", time: "08:47", who: "Osaze I. (Finance)", what: "Released payout", target: "₦83,200 to tolu_a" },
  { id: "a3", time: "08:30", who: "Adaeze N. (Moderator)", what: "Approved pack", target: "Deploy Friday Pack" },
  { id: "a4", time: "Yesterday", who: "Efe A. (Admin)", what: "Changed rule", target: "Thread posting limit: 8 → 5 / hour" },
  { id: "a5", time: "Yesterday", who: "Adaeze N. (Moderator)", what: "Muted 7 days", target: "@loud_lagos · Disrupting a live Buzz" },
  { id: "a6", time: "Yesterday", who: "Osaze I. (Finance)", what: "Issued refund", target: "₦1,104,000 to Brightpath Academy" },
  { id: "a7", time: "Oct 13", who: "Chuka O. (Moderator)", what: "Reject", target: "Retro Pixel Icons by Tunde Bakare" },
  { id: "a8", time: "Oct 13", who: "Efe A. (Admin)", what: "Added Leader Kemi Adeyemi", target: "Web & Frontend" },
  { id: "a9", time: "Oct 12", who: "Adaeze N. (Moderator)", what: "Banned", target: "@airdrop_king · Crypto spam in 6 Spaces" },
  { id: "a10", time: "Oct 12", who: "Efe A. (Admin)", what: "Sent announcement", target: "Scheduled maintenance → All members" },
  { id: "a11", time: "Oct 11", who: "Osaze I. (Finance)", what: "Verify business", target: "Deebug Institute" },
  { id: "a12", time: "Oct 10", who: "Efe A. (Admin)", what: "Changed economy setting", target: "Quest platform fee: 12 → 15 %" },
];

export type QueueTab = "reports" | "appeals" | "shop" | "quests" | "certs" | "advertisers" | "payouts";
export const ROLE_TABS: Record<Role, QueueTab[]> = {
  Moderator: ["reports", "appeals", "shop", "quests", "certs"],
  Finance: ["quests", "advertisers", "payouts"],
  Admin: ["reports", "appeals", "shop", "quests", "certs", "advertisers", "payouts"],
};
export const TAB_LABEL: Record<QueueTab, string> = { reports: "Reports", appeals: "Appeals", shop: "Shop", quests: "Quests", certs: "Certificates", advertisers: "Advertisers", payouts: "Payouts" };

export const QUEUE_DATA = { reports: REPORTS, appeals: APPEALS, shop: SHOP, quests: QUESTS, certs: CERTS, advertisers: ADVERTISERS, payouts: PAYOUTS } as const;

/** Which roles can open each section. Missing means everyone. */
export const ACCESS: Record<string, Role[]> = {
  live: ["Moderator", "Admin"],
  spaces: ["Moderator", "Admin"],
  finance: ["Finance", "Admin"],
  economy: ["Finance", "Admin"],
  reviews: ["Finance", "Admin"],
  staff: ["Admin"],
  rules: ["Admin"],
  announcements: ["Admin"],
  data: ["Admin"],
};
