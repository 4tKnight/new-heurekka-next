"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * The admin site's data, from the Heurekka API through this app's own
 * /api/admin routes (they hold the session; the browser never sees tokens).
 */
export class AdminApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

async function call<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, { ...init, headers: { "content-type": "application/json", ...init?.headers }, cache: "no-store" });
  } catch {
    throw new AdminApiError(0, "NETWORK", "Couldn't reach the server. Check your connection and try again.");
  }
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new AdminApiError(res.status, body?.error?.code ?? "ERROR", body?.error?.message ?? "Something went wrong. Try again.");
  return body as T;
}

export const adminGet = <T>(path: string) => call<T>(`/api/admin/${path}`);
export const adminPost = <T>(path: string, body: unknown) => call<T>(`/api/admin/${path}`, { method: "POST", body: JSON.stringify(body) });
export const adminDelete = <T>(path: string) => call<T>(`/api/admin/${path}`, { method: "DELETE" });
export const adminPatch = <T>(path: string, body: unknown) => call<T>(`/api/admin/${path}`, { method: "PATCH", body: JSON.stringify(body) });

/**
 * Loads `path`, and again whenever it changes or `reload` is called. While a
 * new load runs, the previous data stays on screen.
 */
export function useAdminData<T>(path: string | null) {
  const [tick, setTick] = useState(0);
  const key = path ? `${path}#${tick}` : null;
  const [state, setState] = useState<{ key?: string; data?: T; error?: AdminApiError }>({});
  useEffect(() => {
    if (!key || !path) return;
    let live = true;
    adminGet<T>(path).then(
      (data) => live && setState({ key, data }),
      (error: AdminApiError) => live && setState((s) => ({ key, data: s.data, error })),
    );
    return () => {
      live = false;
    };
  }, [key, path]);
  const reload = useCallback(() => setTick((t) => t + 1), []);
  const current = state.key === key;
  return { data: state.data, error: current ? state.error : undefined, loading: !!key && !current, reload };
}

// ---- Shapes the API returns ----

export type StaffRole = "moderator" | "finance" | "admin";
export type StaffMe = { id: string; name: string; email: string; avatarUrl: string | null; staffRole: StaffRole };

export type Person = { id: string; name: string; handle: string; displayName: string; avatarUrl: string | null; isLeader: boolean; headline: string };

export type WeekMetrics = {
  week: string;
  activePeople: number;
  retained: { kept: number; of: number } | null;
  posts: number;
  repliesPerPost: number | null;
  medianFirstReplyMinutes: number | null;
  repliedIn24h: number | null;
  participation: number | null;
  postsByKind: Record<"ask" | "feedback" | "showcase" | "discussion" | "opportunity", number>;
  /** Friendships made that week, each counted once. */
  newFriendships: number;
  /** DMs sent and chats started that week. Counts only: staff never see message content. */
  messages: number;
  newChats: number;
};

export type Overview = {
  totals: { people: number; newThisWeek: number; postsThisWeek: number; repliesThisWeek: number; clipsUnderReview: number; spaces: number; leaders: number; notificationsThisWeek: number; messagesThisWeek: number };
  /** Push notifications are set up (OneSignal). */
  pushReady: boolean;
  weeks: WeekMetrics[];
  /** Moderation queue health. */
  queue: { openReports: number; urgentReports: number; oldestOpenAt: string | null; oldestUrgentAt: string | null; openAppeals: number; oldestAppealAt: string | null; heldPosts: number };
};

export type UserRow = Person & { email: string; joinedAt: string; lastActiveAt: string; status: "Active" | "Signing up" | "Deleting"; threads: number; replies: number };

export type UserDetail = Person & {
  email: string;
  bio: string;
  interests: string[];
  joinedAt: string;
  lastActiveAt: string;
  status: UserRow["status"];
  signsInWith: string[];
  devices: number;
  spaces: { id: string; name: string }[];
  threadsWithAcceptedAnswer: number;
  friends: number;
  /** How many people blocked them: a moderation signal, never shown to the person. */
  blockedBy: number;
  friendRequestsThisWeek: number;
  /** DM activity as counts; message content is never available to staff. */
  chats: number;
  messagesThisWeek: number;
  messageRequestsThisWeek: number;
  moderation: UserRecord;
  leader: LeaderRecord;
  /** Stopped from hosting Buzz. */
  liveBlocked: boolean;
  buzzHosted: number;
  sparks: SparksRecord;
  recentThreads: { id: string; title: string; kind: string; where: string; replies: number; createdAt: string }[];
  recentReplies: { id: string; threadId: string; threadTitle: string; body: string; where: string; createdAt: string }[];
};

export type LabRow = { id: string; number: number; name: string; title: string; description: string; inviteOnly: boolean; archived: boolean; members: number; threads: number; threadsThisWeek: number };
export type SpaceRow = { id: string; slug: string; name: string; abbr: string; description: string; tags: string[]; isPublic: boolean; archived: boolean; members: number; team: (Person & { role: string })[]; labs: LabRow[] };

export type AnnouncementRow = { id: string; title: string; body: string; audience: string; recipients: number; by: string; createdAt: string };

export type ClipRow = {
  id: string;
  url: string;
  poster: string;
  w: number;
  h: number;
  durationMs: number;
  status: "pending" | "approved" | "rejected";
  author: Person;
  createdAt: string;
  post: { threadId: string; title: string; isReply: boolean } | null;
};

// ---- Formatting ----

/** "3h ago", "2d ago", then a date. */
/** Minutes since a time, for queue ages; 0 when there's none. */
export const minutesSince = (iso: string | null | undefined) => (iso ? Math.round((Date.now() - new Date(iso).getTime()) / 60000) : 0);

export function ago(iso: string) {
  const mins = (Date.now() - new Date(iso).getTime()) / 60000;
  if (mins < 1) return "just now";
  if (mins < 60) return `${Math.round(mins)}m ago`;
  if (mins < 1440) return `${Math.round(mins / 60)}h ago`;
  if (mins < 1440 * 7) return `${Math.round(mins / 1440)}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export const pct = (x: number | null) => (x == null ? "—" : `${Math.round(x * 100)}%`);
export const minutes = (m: number | null) => (m == null ? "—" : m < 60 ? `${Math.round(m)} min` : `${(m / 60).toFixed(1)} h`);

// ---- Moderation ----

export type Standing = { state: "good" | "muted" | "suspended" | "banned"; until: string | null };

export type UserRecord = {
  standing: Standing;
  reportsAgainst: { open: number; actioned: number; dismissed: number };
  reportsMade: number;
  actions: { id: string; kind: string; label: string; rule: string; note: string; until: string | null; by: string; reversed: boolean; appeal: string | null; createdAt: string }[];
};

/** The content as it was when reported. */
export type Snapshot = { title?: string; body?: string; images?: { url: string; w: number; h: number }[]; where?: string; path?: string; name?: string };

export type ReportReason = "spam" | "harassment" | "hate" | "dangerous" | "stolen" | "safety" | "offtopic" | "other";

/** Every open report about one thing, together. */
export type ReportGroup = {
  key: string;
  targetType: "thread" | "reply" | "message" | "user";
  targetId: string;
  snapshot: Snapshot;
  reported: Person & { email: string; standing: Standing };
  priorActions: number;
  reasons: { reason: ReportReason; label: string; count: number }[];
  topReason: ReportReason;
  severity: number;
  route: string;
  reports: number;
  contexts: string[];
  held: boolean;
  /** A Space's moderators passed it to staff. */
  escalated: boolean;
  status: "open" | "actioned" | "dismissed";
  outcome: string;
  firstAt: string;
  lastAt: string;
};

export type AppealRow = {
  id: string;
  user: Person;
  body: string;
  status: "open" | "upheld" | "overturned";
  decision: string;
  decidedBy: string | null;
  createdAt: string;
  action: { id: string; kind: string; stepLabel: string; rule: ReportReason; ruleLabel: string; note: string; snapshot: Snapshot; until: string | null; by: string; staffId: string; createdAt: string };
};

export type AuditRow = { id: string; who: string; what: string; target: string; createdAt: string };

export type AutoRules = {
  newAccountLinks: { on: boolean; days: number };
  newAccountDms: { on: boolean; days: number };
  threadsPerHour: { on: boolean; limit: number };
  autoHide: { on: boolean; reports: number };
  words: { on: boolean; list: string[] };
};

export const RULE_OPTIONS: { id: ReportReason; label: string }[] = [
  { id: "safety", label: "Threats or self-harm" },
  { id: "harassment", label: "Harassment" },
  { id: "hate", label: "Hate" },
  { id: "spam", label: "Spam or scam" },
  { id: "dangerous", label: "Dangerous advice" },
  { id: "stolen", label: "Stolen content" },
  { id: "offtopic", label: "Off-topic for this Lab" },
  { id: "other", label: "Something else" },
];

// ---- Leaders ----

export type Criterion = { key: string; label: string; help: string; current: number; goal: number; done: boolean };
export type LeaderPath = { isLeader: boolean; leaderSince: string | null; met: number; allMet: boolean; criteria: Criterion[] };

export type LeaderRecord = {
  role: "member" | "leader" | "staff";
  since: string | null;
  identityVerified: boolean;
  followers: number;
  endorsements: number;
  /** For members: progress toward Leader. */
  path: LeaderPath | null;
};

export type LeaderCandidate = Person & { path: LeaderPath };

// ---- Sparks ----

export type SparksRules = {
  answerAccepted: number;
  cheer: number;
  cheerCapPerReply: number;
  firstThread: number;
  welcome: number;
  dailyBonusCap: number;
  holdDays: number;
  reviewPrice: number;
  reviewPay: number;
  reviewHours: number;
  creatorShare: number;
  reviewedItems: number;
  reportDays: number;
  fixDays: number;
};

export type ShopItemRow = {
  id: string;
  kind: "memoji" | "toolkit";
  name: string;
  description: string;
  price: number;
  status: "draft" | "in_review" | "rejected" | "listed" | "unlisted" | "removed";
  creator: Person;
  preview: { id: string; url: string; w: number; h: number }[];
  count: number;
  version: string;
  sales: number;
  staffNote: string;
  canResubmit: boolean;
  submittedAt: string | null;
  listedAt: string | null;
  stickers?: { id: string; url: string; w: number; h: number }[];
  files?: { id: string; name: string; bytes: number }[];
};

export type ShopCaseRow = {
  id: string;
  status: "open" | "fixed" | "refunded";
  note: string;
  fixNote: string;
  fixBy: string;
  staffNote: string;
  createdAt: string;
  buyer: Person;
  price: number;
  item: ShopItemRow;
};

export type ReviewRow = {
  id: string;
  status: "open" | "done" | "refunded";
  ask: string;
  price: number;
  thread: { id: string; title: string; where: string } | null;
  asker: Person | null;
  leader: Person | null;
  reviewer: Person | null;
  body: string;
  dueAt: string;
  answeredAt: string | null;
  refundedAt: string | null;
  refundReason: string;
  helpful: boolean | null;
  reported: boolean;
  reportNote: string;
  reportedAt: string | null;
  createdAt: string;
};

export type Economy = {
  /** Sparks people hold right now, by kind. */
  outstanding: { earned: number; bought: number; bonus: number };
  thisWeek: { kind: string; label: string; sparks: number; count: number }[];
  tipsThisWeek: { sparks: number; count: number };
  rules: SparksRules;
};

export type SparksBalance = { total: number; earned: number; bought: number; bonus: number; tippable: number; onHold: number; cashable: number; earnedThisWeek: number };
export type SparkEntry = { id: string; amount: number; bucket: "earned" | "bought" | "bonus"; kind: string; label: string; note: string; person: Person | null; createdAt: string; availableAt: string | null };
export type SparksRecord = { balance: SparksBalance; recent: SparkEntry[] };
