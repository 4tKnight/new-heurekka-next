/** Mock data for the advertiser portal (Heurekka for business). No server yet. */

/** ✦1 = ₦160. Quest costs are paid in naira. */
export const SPARK_NGN = 160;
export const QUEST_FEE = 0.15;
export const MIN_TOPUP = 800_000;
export const MAX_TEAM = 10;
export const MAX_STEPS = 5;

export type TaskId = "api" | "tutorial" | "survey" | "event" | "placement";

export type Task = { id: TaskId; label: string; help: string; vLabel: string; vPh: string; vHelp: string };

export const TASKS: Task[] = [
  { id: "api", label: "Try an API or SDK", help: "Verified by a test call to your sandbox", vLabel: "Sandbox endpoint we check", vPh: "https://api.paystack.co/sandbox/heurekka", vHelp: "We call this with the member's Quest ID. Return 200 when their test call succeeded." },
  { id: "tutorial", label: "Finish a tutorial", help: "Verified by a completion code", vLabel: "Tutorial link", vPh: "https://paystack.com/docs/quickstart", vHelp: "Show members a code at the end of the tutorial. We give you a code generator." },
  { id: "survey", label: "Answer a short survey", help: "Up to 5 questions, no personal data", vLabel: "Survey link", vPh: "https://forms.paystack.com/webhooks", vHelp: "Hosted on Heurekka or your own form. No names, phone numbers or addresses." },
  { id: "event", label: "Attend a Buzz session", help: "Verified by staying 15+ minutes", vLabel: "Buzz session", vPh: "Payments office hours · Thu 16:00 WAT", vHelp: "A Leader has to host it in one of your chosen Spaces." },
  { id: "placement", label: "Placement challenge", help: "For hiring and training partners. Tests run in a Lab. Finishers can share their profile with you", vLabel: "Test repository", vPh: "github.com/paystack/heurekka-challenge", vHelp: "Tests run in a Heurekka Lab. Members choose whether to share their profile." },
];

export const taskById = (id: TaskId) => TASKS.find((t) => t.id === id) ?? TASKS[0];

export const SPACES: [string, number][] = [
  ["Web Development", 5210],
  ["Backend", 2870],
  ["Mobile Engineering", 1990],
  ["AI Space", 3402],
  ["Cloud & DevOps", 2140],
  ["Product Design", 1620],
];

export type RoleId = "admin" | "manager" | "analyst";

export const ROLES: { id: RoleId; label: string; help: string }[] = [
  { id: "admin", label: "Admin", help: "Everything, including billing and team." },
  { id: "manager", label: "Campaign manager", help: "Builds, launches and pauses Quests. No billing." },
  { id: "analyst", label: "Analyst", help: "Sees results and exports. Can't change anything." },
];

export type QuestStatus = "Live" | "Paused" | "In review" | "Draft" | "Ended" | "Waiting for verification";

export type Campaign = {
  id: string;
  title: string;
  status: QuestStatus;
  done: number;
  cap: number;
  reward: number;
  task: TaskId;
  spaces: string[];
  /** Verified completions per Space, in the same order as `spaces`. */
  split: number[];
  days: number;
  started: number;
  ends: string;
};

export const CAMPAIGNS: Campaign[] = [
  { id: "c1", title: "Accept your first test payment with Paystack", status: "Live", done: 1320, cap: 2000, reward: 30, task: "api", spaces: ["Web Development", "Backend", "Mobile Engineering"], split: [640, 470, 210], days: 30, started: 2410, ends: "28 Oct" },
  { id: "c2", title: "Tell us how you handle webhooks", status: "Ended", done: 500, cap: 500, reward: 10, task: "survey", spaces: ["Backend"], split: [500], days: 7, started: 612, ends: "2 Oct" },
  { id: "c3", title: "Payments office hours on Buzz", status: "In review", done: 0, cap: 300, reward: 20, task: "event", spaces: ["Web Development", "Mobile Engineering"], split: [0, 0], days: 14, started: 0, ends: "–" },
  { id: "c4", title: "Build a checkout with Paystack Inline", status: "Draft", done: 0, cap: 400, reward: 50, task: "tutorial", spaces: ["Web Development"], split: [0], days: 30, started: 0, ends: "–" },
];

export type Business = { name: string; site: string; email: string; reg: string };

export const BUSINESS: Business = { name: "Paystack", site: "paystack.com", email: "growth@paystack.com", reg: "RC 1312946" };

export type Card = { brand: string; last: string; note: string; def: boolean };

export const CARDS: Card[] = [
  { brand: "VISA", last: "4081", note: "Expires 09/28", def: true },
  { brand: "MC", last: "5531", note: "Expires 02/27", def: false },
];

export type Invoice = { date: string; desc: string; amount: number; status: string };

export const INVOICES: Invoice[] = [
  { date: "8 Oct", desc: "Quest charges · Accept your first test payment", amount: 1_003_200, status: "Paid" },
  { date: "2 Oct", desc: "Quest charges · Tell us how you handle webhooks", amount: 920_000, status: "Paid" },
  { date: "26 Sep", desc: "Bank transfer top-up · INV-0912", amount: 2_400_000, status: "Received" },
  { date: "2 Oct", desc: "Refund of unused budget · webhooks survey", amount: 0, status: "None due" },
  { date: "14 Sep", desc: "Quest charges · SDK quickstart", amount: 1_840_000, status: "Paid" },
];

export type Member = { name: string; email: string; role: RoleId; status: string };

export const TEAM: Member[] = [
  { name: "Ada Nwosu", email: "growth@paystack.com", role: "admin", status: "You" },
  { name: "Tunde Afolabi", email: "tunde@paystack.com", role: "manager", status: "Active" },
  { name: "Zainab Bello", email: "zainab@paystack.com", role: "analyst", status: "Active" },
];

export type Draft = {
  task: TaskId;
  title: string;
  steps: string;
  verify: string;
  picked: string[];
  reward: number;
  cap: number;
  days: number;
  editId: string | null;
};

export const blankDraft = (): Draft => ({
  task: "api",
  title: "",
  steps: "Create a free Paystack test account\nCopy your test secret key\nMake one test charge with the sandbox card",
  verify: "",
  picked: ["Web Development", "Backend"],
  reward: 20,
  cap: 1000,
  days: 30,
  editId: null,
});

/** Naira cost of one verified completion, fee included. */
export const costEach = (reward: number) => reward * SPARK_NGN * (1 + QUEST_FEE);
export const spentOn = (c: Campaign) => c.done * costEach(c.reward);
export const heldFor = (c: Campaign) => (c.status === "Live" || c.status === "Paused" ? (c.cap - c.done) * costEach(c.reward) : 0);

/** Strips scheme, www and path so "https://www.paystack.com/x" → "paystack.com". */
export const domainOf = (site: string) =>
  site
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0]
    .toLowerCase();

export const regOk = (reg: string) => /^(RC|BN)\s?\d{5,8}$/i.test(reg.trim());
export const emailOnDomain = (email: string, domain: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) && email.toLowerCase().endsWith("@" + domain);
