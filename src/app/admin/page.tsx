"use client";

import Link from "next/link";

import { Badge, fmt, SectionLabel, type Tone } from "@/components/ui";
import { QUEUE_DATA, ROLE_TABS, TAB_LABEL, type QueueTab } from "@/lib/admin-data";
import { PageHeader } from "./admin-shell";
import { useAdmin } from "./admin-store";
import { adminPost, minutes, minutesSince as waited, pct, useAdminData, type AdminApiError, type Overview, type WeekMetrics } from "./admin-api";
import { Button } from "@/components/ui";
import { useToast } from "@/components/toast";
import { LoadError, Loading, PrototypeNote } from "./data-state";

const mins = (a: string) => {
  const n = parseFloat(a);
  return a.endsWith("d") ? n * 1440 : a.endsWith("h") ? n * 60 : n;
};
const ageLabel = (m: number) => (m >= 1440 ? `${Math.round(m / 1440)}d` : m >= 60 ? `${Math.round(m / 60)}h` : `${m}m`);
const TARGET: Partial<Record<QueueTab, number>> = { certs: 2880, appeals: 4320, shop: 2880, quests: 2880, advertisers: 2880, payouts: 1440 };

const KIND_LABEL: Record<keyof WeekMetrics["postsByKind"], string> = {
  ask: "Ask the room",
  feedback: "Get feedback",
  showcase: "Show what I built",
  discussion: "Discussion",
  opportunity: "Opportunity",
};

/** "Week of 19 Oct". */
const weekOf = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

export default function Dashboard() {
  const a = useAdmin();
  const o = useAdminData<Overview>("overview");
  // Real queues: [label, tab, open, minutes the oldest has waited, target minutes].
  const q = o.data?.queue;
  const live: [string, string, number, number, number][] =
    a.role === "Finance" || !q
      ? []
      : [
          // Safety reports are handled within hours, everything else within a day.
          ["Safety reports", "reports", q.urgentReports, waited(q.oldestUrgentAt), 240],
          ["Other reports", "reports", q.openReports - q.urgentReports, waited(q.oldestOpenAt), 1440],
          ["Appeals", "appeals", q.openAppeals, waited(q.oldestAppealAt), 4320],
        ];
  // Queues whose stages haven't shipped yet (Shop, Quests, payouts…).
  const proto: [string, QueueTab, { age: string }[], number][] = ROLE_TABS[a.role]
    .filter((t) => t !== "reports" && t !== "appeals")
    .map((t) => [TAB_LABEL[t], t, (QUEUE_DATA[t] as readonly { id: string; age: string }[]).filter((x) => !a.done[x.id]), TARGET[t]!]);
  const health = (oldest: number, open: number, tgt: number): [string, Tone] => (!open ? ["Clear", "green"] : oldest >= tgt ? ["Late", "red"] : oldest >= tgt * 0.75 ? ["At risk", "gold"] : ["On track", "green"]);
  const row = (label: string, tab: string, open: number, oldest: number, tgt: number) => {
    const [status, tone] = health(oldest, open, tgt);
    return (
      <Link
        key={label}
        href={`/admin/queue?tab=${tab}`}
        className="grid min-h-[52px] grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))_90px] items-center gap-3 border-b border-raised bg-card px-4 py-2 last:border-b-0 hover:bg-raised"
      >
        <span className="text-sm font-semibold">{label}</span>
        <span className="mono text-[13px]">{open} open</span>
        <span className="mono text-xs text-muted">oldest {open ? ageLabel(oldest) : "—"}</span>
        <span className="mono text-xs text-muted">target {ageLabel(tgt)}</span>
        <Badge tone={tone} className="justify-self-end">
          {status}
        </Badge>
      </Link>
    );
  };

  return (
    <>
      <PageHeader title="Dashboard" sub="How the community is doing this week, progress toward launch targets, and queue health." />
      {o.error ? (
        <LoadError error={o.error} onRetry={o.reload} />
      ) : !o.data ? (
        <Loading />
      ) : (
        <Engagement data={o.data} />
      )}
      <div className="flex max-w-[1040px] flex-col gap-6">
        <div className="flex flex-col gap-2.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <SectionLabel>Queue health</SectionLabel>
            {!!q?.heldPosts && <span className="text-xs text-muted">{fmt(q.heldPosts)} {q.heldPosts === 1 ? "post" : "posts"} held from view after reports</span>}
          </div>
          {!!live.length && <div className="flex flex-col overflow-hidden rounded-xl border border-line">{live.map(([label, tab, open, oldest, tgt]) => row(label, tab, open, oldest, tgt))}</div>}
          {!!proto.length && (
            <>
              <PrototypeNote>Prototype data until these stages ship</PrototypeNote>
              <div className="flex flex-col overflow-hidden rounded-xl border border-line">
                {proto.map(([label, tab, items, tgt]) => row(label, tab, items.length, items.reduce((m, x) => Math.max(m, mins(x.age)), 0), tgt))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

/** This week's numbers, the launch targets, and the engagement trend by week. */
function Engagement({ data }: { data: Overview }) {
  const { totals, weeks } = data;
  const thisWeek = weeks.at(-1);
  const lastFull = weeks.at(-2);
  const retention = lastFull?.retained?.of ? lastFull.retained.kept / lastFull.retained.of : null;
  const stats: [string, number, string?][] = [
    ["People", totals.people],
    ["Joined this week", totals.newThisWeek],
    ["Posts this week", totals.postsThisWeek],
    ["Replies this week", totals.repliesThisWeek],
    ["Clips under review", totals.clipsUnderReview, "/admin/queue?tab=clips"],
    ["Notifications this week", totals.notificationsThisWeek],
    ["Messages this week", totals.messagesThisWeek ?? 0],
  ];
  // Launch targets for the first 3 months (PRD).
  const targets: [string, number, number, string][] = [
    ["People", totals.people, 5000, ""],
    ["Spaces", totals.spaces, 100, ""],
    ["Leaders", totals.leaders, 30, ""],
    ["Weekly retention", Math.round((retention ?? 0) * 100), 40, "%"],
    ["Replies per post", Number((thisWeek?.repliesPerPost ?? 0).toFixed(1)), 5, ""],
  ];
  const rows = [...weeks].reverse();
  return (
    <div className="flex max-w-[1040px] flex-col gap-6">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(170px,1fr))] gap-2.5">
        {stats.map(([label, v, href]) => {
          const body = (
            <>
              <span className="text-xs text-muted">{label}</span>
              <span className="mono text-[24px]">{fmt(v)}</span>
            </>
          );
          return href ? (
            <Link key={label} href={href} className="tap flex flex-col gap-2 rounded-xl border border-line bg-card p-4 hover:border-orange">
              {body}
            </Link>
          ) : (
            <div key={label} className="flex flex-col gap-2 rounded-xl border border-line bg-card p-4">
              {body}
            </div>
          );
        })}
      </div>

      <SampleDigest />
      {!data.pushReady && (
        <span className="text-[13px] text-muted">Push notifications are off until OneSignal is set up on the server. Notifications still reach the in-app inbox.</span>
      )}

      <div className="flex flex-col gap-2.5">
        <SectionLabel>Launch targets · first 3 months</SectionLabel>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-2.5">
          {targets.map(([label, v, t, u]) => {
            const p = t ? v / t : 0;
            return (
              <div key={label} className="flex flex-col gap-2.5 rounded-xl border border-line bg-card p-4">
                <span className="text-xs text-muted">{label}</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="mono text-[22px]">
                    {fmt(v)}
                    {u}
                  </span>
                  <span className="mono text-xs text-muted">
                    / {fmt(t)}
                    {u}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-raised">
                  <div className={`h-full rounded-full ${p >= 1 ? "bg-ok" : "bg-orange"}`} style={{ width: `${Math.min(100, Math.round(p * 100))}%` }} />
                </div>
                <span className={`text-xs ${p >= 1 ? "text-ok" : "text-muted"}`}>{p >= 1 ? "Target met" : `${Math.round(p * 100)}% of target`}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        <SectionLabel>Engagement by week</SectionLabel>
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[1000px] border-collapse text-sm">
            <thead>
              <tr className="bg-card text-left text-xs text-muted">
                {["Week of", "Active people", "Came back", "Posts", "Replies per post", "First reply (median)", "Replied in 24 h", "Posted or replied", "New friendships", "Messages", "New chats"].map((h) => (
                  <th key={h} className="border-b border-raised px-3.5 py-2.5 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((w, i) => (
                <tr key={w.week} className="border-b border-raised last:border-b-0">
                  <td className="px-3.5 py-2.5 font-medium">
                    {weekOf(w.week)}
                    {i === 0 && <span className="text-muted"> · so far</span>}
                  </td>
                  <td className="mono px-3.5 py-2.5">{fmt(w.activePeople)}</td>
                  <td className="mono px-3.5 py-2.5">{w.retained ? `${pct(w.retained.of ? w.retained.kept / w.retained.of : null)} (${w.retained.kept}/${w.retained.of})` : "—"}</td>
                  <td className="mono px-3.5 py-2.5">{fmt(w.posts)}</td>
                  <td className="mono px-3.5 py-2.5">{w.repliesPerPost == null ? "—" : w.repliesPerPost.toFixed(1)}</td>
                  <td className="mono px-3.5 py-2.5">{minutes(w.medianFirstReplyMinutes)}</td>
                  <td className="mono px-3.5 py-2.5">{pct(w.repliedIn24h)}</td>
                  <td className="mono px-3.5 py-2.5">{pct(w.participation)}</td>
                  <td className="mono px-3.5 py-2.5">{fmt(w.newFriendships ?? 0)}</td>
                  <td className="mono px-3.5 py-2.5">{fmt(w.messages ?? 0)}</td>
                  <td className="mono px-3.5 py-2.5">{fmt(w.newChats ?? 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {thisWeek && thisWeek.posts > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {(Object.keys(KIND_LABEL) as (keyof typeof KIND_LABEL)[]).map((k) => (
              <span key={k} className="rounded-full border border-line px-3 py-1.5 text-xs text-muted">
                {KIND_LABEL[k]} <span className="mono text-ink">{thisWeek.postsByKind[k]}</span>
              </span>
            ))}
            <span className="self-center text-xs text-muted">posts this week by type</span>
          </div>
        )}
      </div>
    </div>
  );
}

/** Emails the signed-in staff member their own weekly digest, to check how it looks. */
function SampleDigest() {
  const toast = useToast();
  const send = async () => {
    try {
      const r = await adminPost<{ sentTo: string }>("digest/sample", {});
      toast(`Sent your weekly email to ${r.sentTo}.`);
    } catch (e) {
      toast((e as AdminApiError).message);
    }
  };
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button kind="ghost" size="sm" onClick={send}>
        Email me a sample weekly digest
      </Button>
      <span className="text-xs text-muted">Sends what your Monday email would say today. Nobody else&apos;s schedule changes.</span>
    </div>
  );
}
