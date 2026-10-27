"use client";

import { useState } from "react";

import { useConfirm } from "@/components/modal";
import { useToast } from "@/components/toast";
import { Badge, Button, Chip, Field, TextArea } from "@/components/ui";
import { useAdmin } from "../admin-store";
import { adminPost, ago, RULE_OPTIONS, type AdminApiError, type ReportReason, type UserRecord } from "../admin-api";
import { standingText } from "../queue/reports";

type Kind = "warn" | "mute" | "suspend" | "ban";
const KINDS: { id: Kind; label: string }[] = [
  { id: "warn", label: "Warn" },
  { id: "mute", label: "Mute" },
  { id: "suspend", label: "Suspend" },
  { id: "ban", label: "Ban" },
];
const SPANS = [
  { hours: 24, label: "24 hours" },
  { hours: 72, label: "3 days" },
  { hours: 168, label: "7 days" },
  { hours: 720, label: "30 days" },
];

/**
 * A person's moderation record on their admin page: where they stand, reports
 * about them, past actions, and a way to act directly (outside a report).
 */
export function ModerationPanel({
  userId,
  name,
  record,
  liveBlocked,
  buzzHosted,
  onChanged,
}: {
  userId: string;
  name: string;
  record: UserRecord;
  liveBlocked: boolean;
  buzzHosted: number;
  onChanged: () => void;
}) {
  const a = useAdmin();
  const ask = useConfirm();
  const toast = useToast();
  const [kind, setKind] = useState<Kind | null>(null);
  const [rule, setRule] = useState<ReportReason>("harassment");
  const [hours, setHours] = useState(168);
  const [note, setNote] = useState("");
  const [err, setErr] = useState("");
  const canAct = a.role !== "Finance";
  const standing = standingText(record.standing);
  const r = record.reportsAgainst;

  const act = async () => {
    if (!kind) return;
    setErr("");
    if (note.trim().length < 5) return setErr("Tell them what was wrong, in a sentence. They'll see it.");
    if ((kind === "suspend" || kind === "ban") && !(await ask({ title: `${kind === "ban" ? "Ban" : "Suspend"} ${name}?`, body: "They're signed out everywhere and see the reason when they try to sign in.", confirm: kind === "ban" ? "Ban" : "Suspend", danger: true })))
      return;
    try {
      await adminPost(`users/${userId}/action`, { kind, rule, note: note.trim(), ...(kind === "mute" || kind === "suspend" ? { hours } : {}) });
      toast(`Done. ${name} has been told why, and can appeal.`);
      setKind(null);
      setNote("");
      onChanged();
    } catch (e) {
      setErr((e as AdminApiError).message);
    }
  };

  const lift = async () => {
    if (!(await ask({ title: `Lift the restriction on ${name}?`, body: "They can post (and sign in) again straight away, and are told.", confirm: "Lift" }))) return;
    try {
      await adminPost(`users/${userId}/lift`, { note: "" });
      toast("Lifted.");
      onChanged();
    } catch (e) {
      toast((e as AdminApiError).message);
    }
  };

  return (
    <div className="flex flex-col gap-3 border-t border-raised pt-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[13px] font-semibold text-muted">Moderation</span>
        {standing ? <Badge tone="red">{standing}</Badge> : <Badge tone="green">In good standing</Badge>}
        <span className="text-xs text-muted">
          Reports about them: {r.open} open · {r.actioned} actioned · {r.dismissed} dismissed · they made {record.reportsMade}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted">Hosted {buzzHosted} Buzz</span>
        {liveBlocked && <Badge tone="red">Can&apos;t go live</Badge>}
        {canAct && (
          <Button
            size="sm"
            kind={liveBlocked ? "neutral" : "text"}
            onClick={async () => {
              try {
                await adminPost(`users/${userId}/live-block`, { on: !liveBlocked });
                toast(liveBlocked ? `${name} can host Buzz again.` : `${name} can't host Buzz now.`);
                onChanged();
              } catch (e) {
                toast((e as AdminApiError).message);
              }
            }}
          >
            {liveBlocked ? "Allow going live" : "Stop going live"}
          </Button>
        )}
      </div>
      {record.actions.map((x) => (
        <div key={x.id} className="flex flex-col gap-0.5 border-b border-raised py-2 last:border-b-0">
          <span className="text-sm">
            <span className="font-semibold">{x.label}</span>
            {x.kind !== "lift" && <span className="text-muted"> · {x.rule}</span>}
            {x.reversed && <span className="text-muted"> · reversed</span>}
            {x.appeal && <span className="text-muted"> · appeal {x.appeal}</span>}
          </span>
          {x.note && <span className="text-[13px] text-soft">{x.note}</span>}
          <span className="mono text-[11px] text-muted">
            by {x.by} · {ago(x.createdAt)}
            {x.until ? ` · until ${new Date(x.until).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}` : ""}
          </span>
        </div>
      ))}
      {!record.actions.length && <span className="text-[13px] text-muted">No past actions.</span>}
      {canAct && (
        <>
          <div className="flex flex-wrap items-center gap-1.5">
            {KINDS.map((k) => (
              <Chip key={k.id} on={kind === k.id} onClick={() => setKind(kind === k.id ? null : k.id)}>
                {k.label}
              </Chip>
            ))}
            {standing && (
              <Button size="sm" onClick={lift}>
                Lift restriction
              </Button>
            )}
          </div>
          {kind && (
            <div className="flex flex-col gap-3 rounded-xl border border-raised bg-ground p-3.5">
              <Field label="Rule">
                <select value={rule} onChange={(e) => setRule(e.target.value as ReportReason)} className="min-h-11 rounded-xl border border-line bg-card px-3 text-sm">
                  {RULE_OPTIONS.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </Field>
              {(kind === "mute" || kind === "suspend") && (
                <div className="flex flex-wrap gap-1.5">
                  {SPANS.map((s) => (
                    <Chip key={s.hours} on={hours === s.hours} onClick={() => setHours(s.hours)}>
                      {s.label}
                    </Chip>
                  ))}
                </div>
              )}
              <Field label="What they did wrong · they see this" error={err || undefined}>
                <TextArea rows={3} value={note} maxLength={500} onChange={(e) => setNote(e.target.value)} />
              </Field>
              <div className="flex justify-end">
                <Button kind={kind === "suspend" || kind === "ban" ? "danger" : "primary"} onClick={act}>
                  {KINDS.find((k) => k.id === kind)!.label} {name.split(" ")[0]}
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
