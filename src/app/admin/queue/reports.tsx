"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { useConfirm } from "@/components/modal";
import { useToast } from "@/components/toast";
import { Badge, Button, Chip, cx, Field, TextArea, type Tone } from "@/components/ui";
import { adminPost, ago, RULE_OPTIONS, useAdminData, type AdminApiError, type ReportGroup, type ReportReason, type Snapshot, type Standing } from "../admin-api";
import { LoadError, Loading } from "../data-state";

const SEVERITY: Record<number, [string, Tone]> = { 3: ["Safety", "red"], 2: ["High", "orange"], 1: ["Normal", "gold"], 0: ["Low", "grey"] };
const NOUN = { thread: "Post", reply: "Reply", message: "Direct message", user: "Profile" } as const;

type Act = "dismiss" | "warn" | "remove" | "mute" | "suspend" | "ban";
const ACTIONS: { id: Act; label: string; help: string }[] = [
  { id: "dismiss", label: "Dismiss", help: "It doesn't break the guidelines. It goes back on view if it was held." },
  { id: "warn", label: "Warn", help: "Step 1. A notice with the rule; nothing else changes." },
  { id: "remove", label: "Remove", help: "Step 2. The post comes down; they get a notice." },
  { id: "mute", label: "Mute", help: "Step 3. They can read but not post, reply or message." },
  { id: "suspend", label: "Suspend", help: "Step 4. Signed out and can't sign in until it ends." },
  { id: "ban", label: "Ban", help: "Step 5. Signed out for good, unless an appeal succeeds." },
];
const SPANS = [
  { hours: 24, label: "24 hours" },
  { hours: 72, label: "3 days" },
  { hours: 168, label: "7 days" },
  { hours: 720, label: "30 days" },
];

export function standingText(s: Standing) {
  if (s.state === "good") return null;
  if (s.state === "banned") return "Banned";
  return `${s.state === "muted" ? "Muted" : "Suspended"} until ${new Date(s.until!).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}`;
}

export function SnapshotView({ s, kind }: { s: Snapshot; kind: string }) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-raised bg-ground px-4 py-3.5">
      <span className="mono text-[11px] uppercase tracking-[0.08em] text-muted">
        {kind}
        {s.where ? ` · ${s.where}` : ""}
      </span>
      {s.title && <span className="text-[15px] font-semibold leading-snug">{s.title}</span>}
      {s.body && <p className="whitespace-pre-wrap text-sm leading-relaxed text-soft">{s.body}</p>}
      {!!s.images?.length && (
        <div className="flex flex-wrap gap-2">
          {s.images.map((i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i.url} src={i.url.replace("/image/upload/", "/image/upload/w_320,c_limit,q_auto,f_auto/")} alt="" className="h-28 rounded-lg object-cover" />
          ))}
        </div>
      )}
      {!s.title && !s.body && !s.images?.length && <span className="text-[13px] text-muted">No text.</span>}
    </div>
  );
}

/**
 * Reports, one row per reported thing, most severe and oldest first. Until
 * Leaders arrive, staff handle every route (safety, Space and Lab).
 */
export function ReportsQueue({ onChanged }: { onChanged: () => void }) {
  const router = useRouter();
  const [status, setStatus] = useState<"open" | "closed">("open");
  const list = useAdminData<ReportGroup[]>(`reports?status=${status}`);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const rows = list.data ?? [];
  const sel = rows.find((r) => r.key === openKey) ?? rows[0];

  return (
    <div className="flex max-w-[1180px] flex-col gap-3.5">
      <div className="flex flex-wrap items-center gap-2">
        <Chip on={status === "open"} onClick={() => setStatus("open")}>
          Open
        </Chip>
        <Chip on={status === "closed"} onClick={() => setStatus("closed")}>
          Decided (30 days)
        </Chip>
        <span className="text-[13px] text-muted">Safety first, then oldest. Reports about the same thing are grouped.</span>
      </div>
      {list.error ? (
        <LoadError error={list.error} onRetry={list.reload} />
      ) : !list.data ? (
        <Loading rows={3} />
      ) : !rows.length ? (
        <div className="flex flex-col gap-1.5 rounded-xl border border-dashed border-line px-5 py-7 text-center">
          <span className="text-[15px] font-semibold">{status === "open" ? "No open reports" : "Nothing decided lately"}</span>
          <span className="text-[13px] text-muted">Reports from the app land here.</span>
        </div>
      ) : (
        <div className="flex flex-wrap items-start gap-[18px]">
          <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-2">
            {rows.map((r) => {
              const [sev, tone] = SEVERITY[r.severity] ?? SEVERITY[0]!;
              return (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => setOpenKey(r.key)}
                  className={cx("flex flex-col gap-1.5 rounded-xl border px-3.5 py-3 text-left", sel?.key === r.key ? "border-orange bg-card" : "border-line bg-card hover:border-soft")}
                >
                  <div className="flex items-center gap-2">
                    <Badge tone={tone}>{sev}</Badge>
                    <span className="text-xs text-muted">{NOUN[r.targetType]}</span>
                    {r.held && <Badge tone="grey">Held</Badge>}
                    {r.escalated && <Badge tone="orange">Escalated</Badge>}
                    <span className="mono ml-auto text-[11px] text-muted">{ago(r.lastAt)}</span>
                  </div>
                  <span className="line-clamp-1 text-sm font-semibold">{r.snapshot.title ?? r.snapshot.body ?? r.reported.name}</span>
                  <span className="text-xs text-muted">
                    {r.reasons.map((x) => `${x.label}${x.count > 1 ? ` ×${x.count}` : ""}`).join(" · ")} · by {r.reported.name}
                  </span>
                </button>
              );
            })}
          </div>
          {sel && (
            <Detail
              key={sel.key}
              r={sel}
              onOpenUser={(id) => router.push(`/admin/users?u=${id}`)}
              onDone={() => {
                setOpenKey(null);
                list.reload();
                onChanged();
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}

function Detail({ r, onDone, onOpenUser }: { r: ReportGroup; onDone: () => void; onOpenUser: (id: string) => void }) {
  const ask = useConfirm();
  const toast = useToast();
  const [act, setAct] = useState<Act>(r.targetType === "user" ? "warn" : "remove");
  const [rule, setRule] = useState<ReportReason>(r.topReason);
  const [hours, setHours] = useState(168);
  const [removePost, setRemovePost] = useState(true);
  const [note, setNote] = useState("");
  const [err, setErr] = useState("");
  const [sev, tone] = SEVERITY[r.severity] ?? SEVERITY[0]!;
  const standing = standingText(r.reported.standing);
  const open = r.status === "open";
  const timed = act === "mute" || act === "suspend";
  const canRemovePost = r.targetType !== "user" && act !== "dismiss" && act !== "remove";

  const submit = async () => {
    setErr("");
    if (act !== "dismiss" && note.trim().length < 5) return setErr("Tell them what was wrong, in a sentence. They'll see it.");
    if ((act === "suspend" || act === "ban") && !(await ask({ title: `${act === "ban" ? "Ban" : "Suspend"} ${r.reported.name}?`, body: "They're signed out everywhere and see the reason when they try to sign in. Logged in the audit log.", confirm: act === "ban" ? "Ban" : "Suspend", danger: true })))
      return;
    try {
      const res = await adminPost<{ closed: number; outcome: string }>(`reports/${r.targetType}/${r.targetId}/resolve`, {
        action: act,
        rule,
        note: note.trim(),
        ...(timed ? { hours } : {}),
        removePost: canRemovePost && removePost,
      });
      toast(`${res.closed} ${res.closed === 1 ? "report" : "reports"} closed. ${res.outcome}`);
      onDone();
    } catch (e) {
      setErr((e as AdminApiError).message);
    }
  };

  return (
    <div className="rise flex min-w-0 flex-[2_1_440px] flex-col gap-4 rounded-2xl border border-line bg-card p-[22px]">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={tone}>{sev}</Badge>
        <span className="text-[13px] text-muted">
          {r.reports} {r.reports === 1 ? "report" : "reports"} · for {r.route} · first {ago(r.firstAt)}
        </span>
        {r.held && <Badge tone="grey">Held from view</Badge>}
        {r.escalated && <Badge tone="orange">Escalated by the Space&apos;s moderators</Badge>}
      </div>
      <SnapshotView s={r.snapshot} kind={NOUN[r.targetType]} />
      <div className="flex flex-col gap-1.5">
        {r.reasons.map((x) => (
          <span key={x.reason} className="text-sm">
            <span className="font-semibold">{x.label}</span>
            <span className="text-muted"> · {x.count}</span>
          </span>
        ))}
        {r.contexts.map((c, i) => (
          <span key={i} className="border-l-2 border-line pl-2.5 text-[13px] leading-snug text-soft">
            {c}
          </span>
        ))}
      </div>
      <button type="button" onClick={() => onOpenUser(r.reported.id)} className="flex flex-wrap items-center gap-2 rounded-xl border border-raised px-3.5 py-2.5 text-left hover:border-line">
        <span className="text-sm font-semibold">{r.reported.name}</span>
        <span className="text-[13px] text-muted">@{r.reported.handle}</span>
        {standing && <Badge tone="red">{standing}</Badge>}
        <span className="ml-auto text-xs text-muted">{r.priorActions ? `${r.priorActions} past ${r.priorActions === 1 ? "action" : "actions"}` : "No past actions"} ›</span>
      </button>

      {open ? (
        <div className="flex flex-col gap-3 border-t border-raised pt-4">
          <div className="flex flex-wrap gap-1.5">
            {ACTIONS.filter((a) => !(r.targetType === "user" && a.id === "remove")).map((a) => (
              <Chip key={a.id} on={act === a.id} onClick={() => setAct(a.id)}>
                {a.label}
              </Chip>
            ))}
          </div>
          <span className="text-[13px] text-muted">{ACTIONS.find((a) => a.id === act)!.help}</span>
          {act !== "dismiss" && (
            <>
              <Field label="Rule">
                <select value={rule} onChange={(e) => setRule(e.target.value as ReportReason)} className="min-h-11 rounded-xl border border-line bg-ground px-3 text-sm">
                  {RULE_OPTIONS.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </Field>
              {timed && (
                <div className="flex flex-wrap gap-1.5">
                  {SPANS.map((s) => (
                    <Chip key={s.hours} on={hours === s.hours} onClick={() => setHours(s.hours)}>
                      {s.label}
                    </Chip>
                  ))}
                </div>
              )}
              {canRemovePost && (
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={removePost} onChange={(e) => setRemovePost(e.target.checked)} className="h-4 w-4 accent-[var(--orange)]" />
                  Also remove the {NOUN[r.targetType].toLowerCase()}
                </label>
              )}
            </>
          )}
          <Field label={act === "dismiss" ? "Note (optional, for the audit log)" : "What they did wrong · they see this"} error={err || undefined}>
            <TextArea rows={3} value={note} maxLength={500} onChange={(e) => setNote(e.target.value)} placeholder={act === "dismiss" ? "" : "Calling someone an idiot for asking a question."} />
          </Field>
          <div className="flex justify-end">
            <Button kind={act === "dismiss" ? "neutral" : act === "suspend" || act === "ban" ? "danger" : "primary"} onClick={submit}>
              {act === "dismiss" ? "Dismiss reports" : `${ACTIONS.find((a) => a.id === act)!.label} and close`}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-1 border-t border-raised pt-4">
          <span className="text-sm font-semibold">{r.status === "dismissed" ? "Dismissed" : "Action taken"}</span>
          <span className="text-[13px] text-muted">{r.outcome}</span>
        </div>
      )}
    </div>
  );
}
