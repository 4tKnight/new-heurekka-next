"use client";

import { useState } from "react";

import { useToast } from "@/components/toast";
import { Badge, Button, Chip, cx, Field, TextArea } from "@/components/ui";
import { useAdmin } from "../admin-store";
import { adminPost, ago, useAdminData, type AdminApiError, type AppealRow } from "../admin-api";
import { LoadError, Loading } from "../data-state";
import { SnapshotView } from "./reports";

/**
 * Appeals against staff decisions: one per decision, within 14 days.
 * Whoever made the original decision can't decide its appeal.
 */
export function AppealsQueue({ onChanged }: { onChanged: () => void }) {
  const [status, setStatus] = useState<"open" | "closed">("open");
  const list = useAdminData<AppealRow[]>(`appeals?status=${status}`);
  const [openId, setOpenId] = useState<string | null>(null);
  const rows = list.data ?? [];
  const sel = rows.find((r) => r.id === openId) ?? rows[0];
  return (
    <div className="flex max-w-[1180px] flex-col gap-3.5">
      <div className="flex flex-wrap items-center gap-2">
        <Chip on={status === "open"} onClick={() => setStatus("open")}>
          Open
        </Chip>
        <Chip on={status === "closed"} onClick={() => setStatus("closed")}>
          Decided
        </Chip>
        <span className="text-[13px] text-muted">Decided by someone who wasn&apos;t part of the original decision.</span>
      </div>
      {list.error ? (
        <LoadError error={list.error} onRetry={list.reload} />
      ) : !list.data ? (
        <Loading rows={2} />
      ) : !rows.length ? (
        <div className="flex flex-col gap-1.5 rounded-xl border border-dashed border-line px-5 py-7 text-center">
          <span className="text-[15px] font-semibold">{status === "open" ? "No open appeals" : "No decided appeals yet"}</span>
          <span className="text-[13px] text-muted">People appeal from the notice in the app.</span>
        </div>
      ) : (
        <div className="flex flex-wrap items-start gap-[18px]">
          <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-2">
            {rows.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setOpenId(a.id)}
                className={cx("flex flex-col gap-1.5 rounded-xl border px-3.5 py-3 text-left", sel?.id === a.id ? "border-orange bg-card" : "border-line bg-card hover:border-soft")}
              >
                <div className="flex items-center gap-2">
                  <Badge tone={a.status === "overturned" ? "green" : a.status === "upheld" ? "grey" : "gold"}>{a.status === "open" ? a.action.stepLabel : a.status === "overturned" ? "Overturned" : "Upheld"}</Badge>
                  <span className="mono ml-auto text-[11px] text-muted">{ago(a.createdAt)}</span>
                </div>
                <span className="text-sm font-semibold">
                  {a.user.name} · {a.action.ruleLabel}
                </span>
                <span className="line-clamp-2 text-xs text-muted">{a.body}</span>
              </button>
            ))}
          </div>
          {sel && (
            <Detail
              key={sel.id}
              a={sel}
              onDone={() => {
                setOpenId(null);
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

function Detail({ a, onDone }: { a: AppealRow; onDone: () => void }) {
  const me = useAdmin().me;
  const toast = useToast();
  const [decision, setDecision] = useState("");
  const [err, setErr] = useState("");
  const mine = me?.id === a.action.staffId;
  const decide = async (overturn: boolean) => {
    setErr("");
    if (decision.trim().length < 5) return setErr("Explain the decision in a sentence. They'll see it.");
    try {
      await adminPost(`appeals/${a.id}/decide`, { overturn, decision: decision.trim() });
      toast(overturn ? "Overturned. The action is undone and they've been told." : "Upheld. They've been told.");
      onDone();
    } catch (e) {
      setErr((e as AdminApiError).message);
    }
  };
  return (
    <div className="rise flex min-w-0 flex-[2_1_440px] flex-col gap-4 rounded-2xl border border-line bg-card p-[22px]">
      <div className="flex flex-col gap-1">
        <span className="text-[17px] font-bold">
          {a.action.stepLabel} · {a.action.ruleLabel}
        </span>
        <span className="text-[13px] text-muted">
          {a.user.name} (@{a.user.handle}) · decided by {a.action.by} {ago(a.action.createdAt)}
        </span>
      </div>
      {a.action.note && <span className="text-sm text-soft">“{a.action.note}”</span>}
      {(a.action.snapshot.title || a.action.snapshot.body) && <SnapshotView s={a.action.snapshot} kind="What was actioned" />}
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">Their appeal</span>
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{a.body}</p>
      </div>
      {a.status === "open" ? (
        mine ? (
          <span className="rounded-xl border border-dashed border-line px-4 py-3 text-[13px] text-muted">You made the original decision, so someone else on the team has to decide this appeal.</span>
        ) : (
          <div className="flex flex-col gap-3 border-t border-raised pt-4">
            <Field label="Decision · they see this" error={err || undefined}>
              <TextArea rows={3} value={decision} maxLength={1000} onChange={(e) => setDecision(e.target.value)} placeholder="Looking at the whole conversation, …" />
            </Field>
            <div className="flex flex-wrap justify-end gap-2">
              <Button onClick={() => decide(false)}>Uphold</Button>
              <Button kind="primary" onClick={() => decide(true)}>
                Overturn and undo
              </Button>
            </div>
          </div>
        )
      ) : (
        <div className="flex flex-col gap-1 border-t border-raised pt-4">
          <span className="text-sm font-semibold">
            {a.status === "overturned" ? "Overturned" : "Upheld"} by {a.decidedBy}
          </span>
          <span className="text-[13px] text-muted">{a.decision}</span>
        </div>
      )}
    </div>
  );
}
