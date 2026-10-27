"use client";

import { useMemo, useState } from "react";

import { useConfirm } from "@/components/modal";
import { Badge, Button, Check, fmt, Kicker, PAGE_SIZE, Pager, paginate, SearchInput, sparksToNaira, type Tone } from "@/components/ui";
import {
  LEDGER,
  type Advertiser,
  type Appeal,
  type Cert,
  type CheckItem,
  type DataRequest,
  type LiveSession,
  type Payout,
  type QuestReview,
  type Report,
  type ShopReview,
  type SpaceRow,
  type Staff,
  type User,
} from "@/lib/admin-data";
import { useAdmin } from "./admin-store";

export type Kind = "reports" | "appeals" | "shop" | "quests" | "certs" | "advertisers" | "payouts" | "live" | "users" | "staff" | "spaces" | "data";

type ActionBtn = { label: string; kind: "primary" | "neutral" | "danger"; go: () => void };

/**
 * What the confirmation dialog says before an action runs. Every danger action asks first;
 * these are the other actions that are hard to undo or reach a member directly.
 */
const CONFIRM: [RegExp, string][] = [
  [/^Ban$/, "They're signed out everywhere and can't use the account. They can appeal once."],
  [/^Suspend 30 days$/, "They can't sign in for 30 days. They're told why and can appeal."],
  [/^Mute 7 days$/, "They can read but can't post, reply, message, or speak in Buzz for 7 days."],
  [/^Remove content$/, "The content is hidden from everyone and the author is told why."],
  [/^Warn( host)?$/, "They get a warning notice that stays on their record."],
  [/^Restore account$/, "Their restrictions are lifted straight away and they're notified."],
  [/^Reverse$/, "The original decision is undone and the member is notified."],
  [/^Reduce to/, "The ban is replaced with a 30-day suspension and the member is notified."],
  [/^Release payout$/, "Money is sent to their bank account. This can't be recalled."],
  [/^Reject and freeze Sparks$/, "The cash-out is rejected and their Sparks are frozen until reviewed."],
  [/^Approve and launch$/, "The Quest goes live and the budget is held on the advertiser's card."],
  [/^Verify business$/, "The business can launch Quests without further checks."],
  [/^End session$/, "Everyone in the session is disconnected."],
  [/^End and revoke/, "Everyone is disconnected and the host can't go live again until restored."],
  [/^Schedule deletion$/, "The account is deleted after a 30-day grace period. After that it can't be recovered."],
  [/^Remove access$/, "They're signed out of the admin site and can't sign back in."],
  [/^Make (Moderator|Finance|Admin)$/, "Their access changes the next time they load a page."],
  [/^Reset two-factor$/, "They can't sign in until they set up two-factor sign-in again."],
  [/^Remove /, "They lose Leader tools in this Space straight away."],
  [/^Archive Space$/, "The Space and its Labs become read-only and members are notified."],
  [/^Publish Space$/, "The Space becomes visible to every member."],
];
const confirmText = (b: ActionBtn) => CONFIRM.find(([re]) => re.test(b.label))?.[1] ?? (b.kind === "danger" ? "This is recorded in the audit log." : null);
type Detail = {
  kicker: string;
  title: string;
  sub: string;
  quote?: string;
  facts: { k: string; v: string | number }[];
  checksLabel?: string;
  checks: CheckItem[];
  ledger?: { label: string; age: string; amount: string; positive: boolean }[];
  actions: ActionBtn[];
  userId?: string;
};
type Row = { badge: string; tone: Tone; title: string; sub: string; age: string };

export function spaceHealth(x: SpaceRow): [string, Tone] {
  if (x.archived) return ["Archived", "grey"];
  if (x.draft) return ["Draft", "gold"];
  if (!x.leaders.length) return ["No Leader", "red"];
  if (!x.respOk || x.open > 4 || (x.leaders.length < 2 && x.members > 500)) return ["Needs help", "orange"];
  return ["Healthy", "green"];
}

/** Queues show a list on the left and detail on the right; they stack below 760px. */
export function ListDetail<T extends { id: string }>({
  kind,
  items,
  onOpenUser,
  onEdit,
  initialId,
  noun = "items",
}: {
  kind: Kind;
  items: T[];
  onOpenUser?: (uid: string) => void;
  /** Shows an "Edit details" button in the detail pane. */
  onEdit?: (x: T) => void;
  initialId?: string;
  noun?: string;
}) {
  const a = useAdmin();
  const ask = useConfirm();
  const [selId, setSelId] = useState<string | undefined>(initialId);
  const [q, setQ] = useState("");
  // Open on the page holding the initial item, e.g. one that was just created.
  const [page, setPage] = useState(() => Math.max(1, Math.ceil((items.findIndex((x) => x.id === initialId) + 1) / PAGE_SIZE)));
  const userName = (uid: string) => a.users.find((u) => u.id === uid)?.name ?? uid;
  const handle = (uid: string) => a.users.find((u) => u.id === uid)?.handle ?? uid;

  const row = (x: T): Row => {
    const o = x as unknown;
    switch (kind) {
      case "reports": {
        const r = o as Report;
        return { badge: r.sev, tone: r.tone, title: r.title, sub: `@${handle(r.uid)} · ${r.reporters} reports`, age: r.age };
      }
      case "shop": {
        const r = o as ShopReview;
        return { badge: r.badge, tone: r.tone, title: r.name, sub: `${r.type} · ${r.creator} · ✦ ${r.price}`, age: r.age };
      }
      case "quests": {
        const r = o as QuestReview;
        return { badge: r.badge, tone: r.tone, title: r.title, sub: `${r.adv} · ✦ ${r.reward} × ${fmt(r.cap)}`, age: r.age };
      }
      case "payouts": {
        const r = o as Payout;
        return { badge: `${r.risk} risk`, tone: r.tone, title: `${r.name} · ${sparksToNaira(r.sparks)}`, sub: `✦ ${fmt(r.sparks)} · account ${r.acct}`, age: r.age };
      }
      case "appeals": {
        const r = o as Appeal;
        return { badge: r.badge, tone: r.tone, title: `${userName(r.uid)} · ${r.action}`, sub: `by ${r.by} · ${r.when}`, age: r.age };
      }
      case "advertisers": {
        const r = o as Advertiser;
        return { badge: r.badge, tone: r.tone, title: r.name, sub: `${r.reg} · ${r.spend}`, age: r.age };
      }
      case "live": {
        const r = o as LiveSession;
        return { badge: r.badge, tone: r.tone, title: r.title, sub: `${r.kind} · ${r.host} · ${r.count} in`, age: r.started };
      }
      case "certs": {
        const r = o as Cert;
        return { badge: r.badge, tone: r.tone, title: `${userName(r.uid)} · ${r.course}`, sub: `${r.credId} · issued ${r.issued}`, age: r.age };
      }
      case "data": {
        const r = o as DataRequest;
        return { badge: r.badge, tone: r.tone, title: `${r.type} · ${userName(r.uid)}`, sub: `From ${r.from.toLowerCase()} · ${r.due}`, age: r.filed };
      }
      case "spaces": {
        const r = o as SpaceRow;
        const [badge, tone] = spaceHealth(r);
        return { badge, tone, title: r.name, sub: `${fmt(r.members)} members · ${r.labs} Labs · ${r.leaders.length} ${r.leaders.length === 1 ? "Leader" : "Leaders"}`, age: `${r.open} open` };
      }
      case "staff": {
        const r = o as Staff;
        return { badge: r.pending ? "Invited" : r.twofa ? r.role : "2FA off", tone: r.pending ? "gold" : r.twofa ? "grey" : "red", title: r.name, sub: `${r.email} · ${r.role}`, age: r.last };
      }
      default: {
        const r = o as User;
        const tone: Tone = r.status === "Banned" ? "red" : r.status === "Suspended" ? "orange" : r.status === "Trusted creator" ? "green" : r.status === "Restricted" ? "gold" : "grey";
        return { badge: r.status, tone, title: r.name, sub: `@${r.handle} · ${r.reports} reports`, age: r.joined };
      }
    }
  };

  const needle = q.trim().toLowerCase();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const shown = useMemo(() => (needle ? items.filter((x) => Object.values(row(x)).join(" ").toLowerCase().includes(needle)) : items), [items, needle, a.users]);
  const pg = paginate(shown, page);
  const sel = shown.find((x) => x.id === selId) ?? pg.slice[0];

  const run = async (b: ActionBtn, target: string) => {
    const body = confirmText(b);
    if (body && !(await ask({ title: `${b.label}?`, body: `${target}. ${body}`, confirm: b.label, danger: b.kind === "danger" }))) return;
    b.go();
  };

  const btn = (label: string, k: ActionBtn["kind"], go: () => void): ActionBtn => ({ label, kind: k, go });

  const detail = (x: T): Detail => {
    const o = x as unknown;
    switch (kind) {
      case "appeals": {
        const r = o as Appeal;
        const who = userName(r.uid);
        const act = (label: string, k: ActionBtn["kind"], msg: string, status?: string) =>
          btn(label, k, () => a.act({ id: r.id, what: `Appeal: ${label}`, target: `${who} · ${r.action}`, msg, userStatus: status ? { id: r.uid, status } : undefined }));
        const actions = [act("Uphold", "neutral", "Appeal upheld · user notified")];
        if (r.from === "Banned") actions.push(act("Reduce to 30-day suspension", "neutral", "Reduced to a 30-day suspension", "Suspended"));
        actions.push(act("Reverse", "primary", r.from ? "Action reversed · account restored" : "Rejection reversed · pack listed", r.from ? "Active" : undefined));
        return {
          kicker: `Appeal · ${r.badge}`,
          title: `${who} appeals: ${r.action}`,
          sub: `Original action by ${r.by} · ${r.when}`,
          quote: r.msg,
          facts: [
            { k: "Original reason", v: r.reason },
            { k: "Decided by", v: r.by },
            { k: "Appeal filed", v: `${r.age} ago` },
          ],
          checksLabel: "Before deciding",
          checks: [{ ok: false, label: `Must be reviewed by someone other than ${r.by}` }],
          actions,
          userId: r.uid,
        };
      }
      case "advertisers": {
        const r = o as Advertiser;
        const act = (label: string, k: ActionBtn["kind"], msg: string) => btn(label, k, () => a.act({ id: r.id, what: label, target: r.name, msg }));
        return {
          kicker: "Business verification",
          title: r.name,
          sub: `${r.contact} · applied ${r.age} ago`,
          facts: [
            { k: "CAC registration", v: r.reg },
            { k: "First Quest", v: r.spend },
            { k: "Verified once", v: "Covers all future Quests" },
          ],
          checksLabel: "Document checks",
          checks: r.checks,
          actions: [act("Verify business", "primary", `${r.name} verified`), act("Request documents", "neutral", "Document request sent"), act("Reject", "danger", "Application rejected")],
        };
      }
      case "live": {
        const r = o as LiveSession;
        const act = (label: string, k: ActionBtn["kind"], msg: string, done?: boolean, status?: string) =>
          btn(label, k, () => a.act({ id: done ? r.id : undefined, what: label, target: `${r.title} · ${r.host}`, msg, userStatus: status ? { id: r.uid, status } : undefined }));
        return {
          kicker: `Live ${r.kind.toLowerCase()} Buzz · started ${r.started} ago`,
          title: r.title,
          sub: `Hosted by ${r.host}`,
          facts: [
            { k: r.kind === "Video" ? "Watching" : "Listening", v: r.count },
            { k: "Reports this session", v: r.reports },
            { k: "Host", v: r.host },
          ],
          checksLabel: "Signals",
          checks: r.checks,
          actions: [
            act("Join silently", "neutral", "Joined silently · you aren't shown as a listener"),
            act("Warn host", "neutral", "Warning sent to host"),
            act("End session", "danger", "Session ended for everyone", true),
            act("End and revoke live access", "danger", "Session ended · host can't go live", true, "Live revoked"),
          ],
          userId: r.uid,
        };
      }
      case "certs": {
        const r = o as Cert;
        const who = userName(r.uid);
        const act = (label: string, k: ActionBtn["kind"], msg: string) => btn(label, k, () => a.act({ id: r.id, what: label, target: `${who} · ${r.course}`, msg }));
        return {
          kicker: "Deebug Institute certificate",
          title: r.course,
          sub: `Claimed by ${who} · ${r.age} ago`,
          facts: [
            { k: "Credential ID", v: r.credId },
            { k: "Issued", v: r.issued },
            { k: "Shown on profile as", v: "Verified · Deebug Institute" },
          ],
          checksLabel: "Registry check",
          checks: r.checks,
          actions: [act("Approve badge", "primary", "Badge added to profile"), act("Ask for proof", "neutral", "Asked the member for proof"), act("Reject", "danger", "Claim rejected")],
          userId: r.uid,
        };
      }
      case "data": {
        const r = o as DataRequest;
        const who = userName(r.uid);
        const act = (label: string, k: ActionBtn["kind"], msg: string) => btn(label, k, () => a.act({ id: r.id, what: label, target: `${r.type} · ${who}`, msg }));
        const actions =
          r.acts === "export"
            ? [act("Generate export", "primary", "Export ready · link sent, expires in 7 days"), act("Reject", "neutral", "Request rejected · requester notified")]
            : r.acts === "delete"
              ? [act("Schedule deletion", "danger", "Deletion scheduled · 30-day grace period"), act("Hold for evidence", "neutral", "On hold until the report is closed")]
              : [act("Escalate to legal", "primary", "Sent to legal review"), act("Request court order", "neutral", "Court order requested"), act("Decline", "danger", "Request declined")];
        return {
          kicker: r.type,
          title: `${r.type} for ${who}`,
          sub: `From ${r.from.toLowerCase()} · filed ${r.filed} ago`,
          facts: [
            { k: "Account", v: `@${handle(r.uid)}` },
            { k: "Deadline", v: r.due },
            { k: "Requested by", v: r.from },
          ],
          checksLabel: "Before acting",
          checks: r.checks,
          actions,
          userId: r.uid,
        };
      }
      case "spaces": {
        const r = o as SpaceRow;
        const setSpace = (patch: Partial<SpaceRow>, what: string, msg: string) => {
          a.set((s) => ({ spaces: s.spaces.map((m) => (m.id === r.id ? { ...m, ...patch } : m)) }));
          a.act({ what, target: r.name, msg });
        };
        const n = r.leaders.length;
        const checks: CheckItem[] = [
          n === 0 ? { ok: false, label: "No active Leader" } : n === 1 && r.members > 500 ? { ok: false, label: `1 Leader for ${fmt(r.members)} members` } : { ok: true, label: `${n} active ${n === 1 ? "Leader" : "Leaders"}` },
          r.respOk ? { ok: true, label: `Median report response ${r.resp}` } : { ok: false, label: `Median report response ${r.resp}, target 4h` },
          ...(r.extra ?? []),
        ];
        const actions: ActionBtn[] = r.archived
          ? [btn("Restore Space", "primary", () => setSpace({ archived: false }, "Restored Space", "Space restored"))]
          : [
              ...(r.draft && n ? [btn("Publish Space", "primary", () => setSpace({ draft: false, extra: [] }, "Published Space", "Space is live"))] : []),
              ...(r.leaders.includes(r.suggest) ? [] : [btn(`Add Leader: ${r.suggest}`, r.draft && n ? "neutral" : "primary", () => setSpace({ leaders: [...r.leaders, r.suggest] }, `Added Leader ${r.suggest}`, `${r.suggest} is now a Leader`))]),
              ...r.leaders.map((l) => btn(`Remove ${l}`, "neutral", () => setSpace({ leaders: r.leaders.filter((y) => y !== l) }, `Removed Leader ${l}`, `${l} removed as Leader`))),
              btn("Archive Space", "danger", () => setSpace({ archived: true }, "Archived Space", "Space archived · members notified")),
            ];
        return {
          kicker: spaceHealth(r)[0],
          title: r.name,
          sub: r.about || `${fmt(r.members)} members · ${r.labs} Labs`,
          facts: [
            ...(r.topic ? [{ k: "Topic", v: r.topic }] : []),
            ...(r.visibility ? [{ k: "Who can join", v: r.visibility }] : []),
            { k: "Members", v: fmt(r.members) },
            { k: "Leaders", v: n ? r.leaders.join(", ") : "None" },
            { k: "Open reports", v: r.open },
            { k: "Median response", v: r.resp },
          ],
          checksLabel: "Health",
          checks,
          actions,
        };
      }
      case "staff": {
        const r = o as Staff;
        const setStaff = (patch: Partial<Staff>, what: string, msg: string) => {
          a.set((s) => ({ staff: s.staff.map((m) => (m.id === r.id ? { ...m, ...patch } : m)) }));
          a.act({ what, target: r.name, msg });
        };
        return {
          kicker: r.role + (r.pending ? " · invite pending" : ""),
          title: r.name,
          sub: r.email,
          facts: [
            { k: "Role", v: r.role },
            { k: "Last active", v: r.last },
            { k: "Actions this week", v: r.week },
          ],
          checksLabel: "Access",
          checks: [
            r.twofa ? { ok: true, label: "Two-factor sign-in set up" } : { ok: false, label: r.pending ? "Must set up two-factor sign-in on first sign-in" : "Two-factor sign-in off. Sign-in blocked until it's set up" },
            r.week || r.pending ? { ok: true, label: "Activity matches role" } : { ok: false, label: "No activity in 12 days. Consider removing access" },
          ],
          actions: [
            ...(["Moderator", "Finance", "Admin"] as const).filter((x) => x !== r.role).map((x) => btn(`Make ${x}`, "neutral", () => setStaff({ role: x }, `Changed role to ${x}`, `${r.name} is now ${x}`))),
            btn("Reset two-factor", "neutral", () => setStaff({ twofa: false }, "Reset two-factor", "Two-factor reset · they'll set it up again")),
            btn("Remove access", "danger", () => {
              a.set((s) => ({ staff: s.staff.filter((m) => m.id !== r.id) }));
              a.act({ what: "Removed staff access", target: r.name, msg: "Access removed" });
            }),
          ],
        };
      }
      case "reports": {
        const r = o as Report;
        const who = `@${handle(r.uid)}`;
        const act = (label: string, k: ActionBtn["kind"], msg: string, status?: string) =>
          btn(label, k, () => a.act({ id: r.id, what: label, target: `${who} · ${r.title}`, msg, userStatus: status ? { id: r.uid, status } : undefined }));
        return {
          kicker: `${r.sev} · ${r.where}`,
          title: r.title,
          sub: `${who} · reported ${r.age} ago`,
          quote: r.quote,
          facts: [
            { k: "Reporters", v: r.reporters },
            { k: "Prior actions", v: r.prior },
            { k: "Where", v: r.where },
          ],
          checksLabel: "Signals",
          checks: r.checks,
          // Action ladder: warn → remove → mute → suspend → ban.
          actions: [
            act("Dismiss", "neutral", "Report dismissed"),
            act("Remove content", "neutral", "Content removed"),
            act("Warn", "neutral", "Warning sent"),
            act("Mute 7 days", "neutral", "Muted for 7 days", "Muted"),
            act("Suspend 30 days", "danger", "Suspended for 30 days", "Suspended"),
            act("Ban", "danger", "Account banned", "Banned"),
          ],
          userId: r.uid,
        };
      }
      case "shop": {
        const r = o as ShopReview;
        const act = (label: string, k: ActionBtn["kind"], msg: string) => btn(label, k, () => a.act({ id: r.id, what: label, target: `${r.name} by ${r.creator}`, msg }));
        return {
          kicker: `${r.type} · ${r.nth}`,
          title: r.name,
          sub: `by ${r.creator} · submitted ${r.age} ago`,
          facts: [
            { k: "Price", v: `✦ ${r.price} (${sparksToNaira(r.price)})` },
            { k: "Contents", v: r.count },
            { k: "Review target", v: "48 hours" },
          ],
          checksLabel: "Automatic checks",
          checks: r.checks,
          actions: [act("Approve", "primary", "Pack approved and listed"), act("Request changes", "neutral", "Sent back with notes · 1 resubmit allowed"), act("Reject", "danger", "Pack rejected")],
          userId: r.uid,
        };
      }
      case "quests": {
        const r = o as QuestReview;
        const budget = r.reward * r.cap;
        const act = (label: string, k: ActionBtn["kind"], msg: string) => btn(label, k, () => a.act({ id: r.id, what: label, target: `${r.title} · ${r.adv}`, msg }));
        return {
          kicker: `${r.adv}${r.verified ? " · verified business" : " · not verified"}`,
          title: r.title,
          sub: `submitted ${r.age} ago`,
          facts: [
            { k: "Task", v: r.task },
            { k: "Reward", v: `✦ ${r.reward} × ${fmt(r.cap)}` },
            { k: "Held on card", v: `${sparksToNaira(budget * 1.15)} (incl. 15% fee)` },
            { k: "Completion check", v: r.proof },
          ],
          checksLabel: "Review checklist",
          checks: r.checks,
          actions: [act("Approve and launch", "primary", "Quest approved · budget held"), act("Request changes", "neutral", "Sent back to advertiser"), act("Reject", "danger", "Quest rejected · hold released")],
        };
      }
      case "payouts": {
        const r = o as Payout;
        const act = (label: string, k: ActionBtn["kind"], msg: string) => btn(label, k, () => a.act({ id: r.id, what: label, target: `${sparksToNaira(r.sparks)} to ${r.name}`, msg }));
        return {
          kicker: `${r.risk} risk · cash-out request`,
          title: `${sparksToNaira(r.sparks)} to ${r.name}`,
          sub: `✦ ${fmt(r.sparks)} at ✦ 10 = ₦1,600 · requested ${r.age} ago`,
          facts: [
            { k: "Account age", v: r.acct },
            { k: "Pays to", v: "Paystack · Nigerian bank (BVN matched)" },
            { k: "Arrives", v: "2–3 business days" },
          ],
          checksLabel: "Fraud checks",
          checks: r.checks,
          actions: [act("Release payout", "primary", "Payout released"), act("Hold for review", "neutral", "Payout on hold · user notified"), act("Reject and freeze Sparks", "danger", "Payout rejected · Sparks frozen")],
          userId: r.uid,
        };
      }
      default: {
        const r = o as User;
        const act = (label: string, k: ActionBtn["kind"], status: string, msg: string) => btn(label, k, () => a.act({ what: label, target: `@${r.handle}`, msg, userStatus: { id: r.id, status } }));
        const restricted = ["Suspended", "Banned", "Muted", "Live revoked"].includes(r.status);
        const led = LEDGER[r.id] ?? [];
        return {
          kicker: r.status,
          title: r.name,
          sub: `@${r.handle} · joined ${r.joined}`,
          facts: [
            { k: "Sparks", v: `✦ ${fmt(r.sparks)}` },
            { k: "Reports against", v: r.reports },
            { k: "Status", v: r.status },
          ],
          checksLabel: "History",
          checks: r.history,
          ledger: led.map(([label, n, age]) => ({ label, age, amount: `${n > 0 ? "+" : "−"}${fmt(Math.abs(n))}`, positive: n > 0 })),
          actions: restricted
            ? [act("Restore account", "primary", "Active", "Account restored")]
            : [act("Warn", "neutral", r.status, "Warning sent"), act("Mute 7 days", "neutral", "Muted", "Muted for 7 days"), act("Suspend 30 days", "danger", "Suspended", "Suspended for 30 days"), act("Ban", "danger", "Banned", "Account banned")],
        };
      }
    }
  };

  const d = sel ? detail(sel) : null;

  return (
    <div className="flex flex-wrap items-start gap-[18px]">
      <div className="flex max-w-full flex-[1_1_300px] flex-col gap-2 md:max-w-[420px]">
        {items.length > 0 && (
          <SearchInput
            value={q}
            onChange={(v) => {
              setQ(v);
              setPage(1);
            }}
            placeholder={`Search ${noun}`}
          />
        )}
        {pg.slice.map((x) => {
          const r = row(x);
          const on = x.id === sel?.id;
          return (
            <button
              key={x.id}
              type="button"
              onClick={() => setSelId(x.id)}
              className={`tap flex flex-col gap-[7px] rounded-xl border px-3.5 py-[13px] text-left ${on ? "border-orange bg-card" : "border-raised hover:border-line"}`}
            >
              <div className="flex items-center justify-between gap-2.5">
                <Badge tone={r.tone}>{r.badge}</Badge>
                <span className="mono text-[11px] text-muted">{r.age}</span>
              </div>
              <span className="text-sm font-semibold leading-snug">{r.title}</span>
              <span className="text-xs text-muted">{r.sub}</span>
            </button>
          );
        })}
        {items.length === 0 && (
          <div className="flex flex-col gap-1.5 rounded-xl border border-dashed border-line px-5 py-7 text-center">
            <span className="text-[15px] font-semibold">Queue clear</span>
            <span className="text-[13px] text-muted">New items show up here as they come in.</span>
          </div>
        )}
        {items.length > 0 && shown.length === 0 && (
          <div className="flex flex-col gap-1.5 rounded-xl border border-dashed border-line px-5 py-7 text-center">
            <span className="text-[15px] font-semibold">No matches for &ldquo;{q.trim()}&rdquo;</span>
            <button type="button" onClick={() => setQ("")} className="text-[13px] font-semibold text-lift">
              Clear search
            </button>
          </div>
        )}
        <Pager {...pg} onPage={setPage} noun={noun} />
      </div>
      {d && (
        <div className="rise flex min-w-0 flex-[2_1_420px] flex-col gap-[18px] rounded-2xl border border-line bg-card p-[22px]">
          <div className="flex flex-col gap-1.5">
            <Kicker>{d.kicker}</Kicker>
            <h2 className="text-[21px] font-bold leading-tight tracking-[-0.02em]">{d.title}</h2>
            <span className="text-[13px] text-muted">{d.sub}</span>
          </div>
          {d.quote && <div className="rounded-xl border border-raised bg-ground px-4 py-3.5 text-sm leading-relaxed text-soft">{d.quote}</div>}
          <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-x-[18px] gap-y-3">
            {d.facts.map((f) => (
              <div key={f.k} className="flex flex-col gap-[3px]">
                <span className="text-xs text-muted">{f.k}</span>
                <span className="text-sm font-medium">{f.v}</span>
              </div>
            ))}
          </div>
          {d.checks.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-[13px] font-semibold text-muted">{d.checksLabel}</span>
              {d.checks.map((c) => (
                <Check key={c.label} ok={c.ok} label={c.label} />
              ))}
            </div>
          )}
          {d.ledger && (
            <div className="flex flex-col gap-0.5">
              <span className="text-[13px] font-semibold text-muted">Spark activity</span>
              {d.ledger.map((l) => (
                <div key={l.label} className="flex items-baseline gap-3 border-b border-raised py-[9px] text-sm">
                  <span className="min-w-0 flex-1">{l.label}</span>
                  <span className="mono text-xs text-muted">{l.age}</span>
                  <span className={`mono min-w-16 text-right ${l.positive ? "text-ok" : "text-soft"}`}>{l.amount}</span>
                </div>
              ))}
              {d.ledger.length === 0 && <span className="py-1.5 text-[13px] text-muted">No Spark activity.</span>}
            </div>
          )}
          <div className="flex flex-wrap gap-2 border-t border-raised pt-3.5">
            {d.actions.map((b) => (
              <Button key={b.label} kind={b.kind} onClick={() => run(b, d.title)}>
                {b.label}
              </Button>
            ))}
            {onEdit && sel && (
              <Button kind="ghost" onClick={() => onEdit(sel)}>
                Edit details
              </Button>
            )}
            {d.userId && onOpenUser && (
              <button type="button" onClick={() => onOpenUser(d.userId!)} className="ml-auto min-h-11 px-1.5 text-sm font-semibold text-lift">
                View user →
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
