"use client";

import { useState } from "react";

import { useToast } from "@/components/toast";
import { Badge, Button, Card, Chip, cx, Field, TextArea } from "@/components/ui";
import { PageHeader } from "../admin-shell";
import { adminPost, ago, useAdminData, type AdminApiError, type ReviewRow } from "../admin-api";
import { LoadError, Loading } from "../data-state";

const FILTERS: { id: "" | ReviewRow["status"]; label: string }[] = [
  { id: "", label: "All" },
  { id: "open", label: "Waiting" },
  { id: "done", label: "Written" },
  { id: "refunded", label: "Refunded" },
];

const STATUS: Record<ReviewRow["status"], { label: string; tone: "gold" | "green" | "grey" }> = {
  open: { label: "Waiting", tone: "gold" },
  done: { label: "Written", tone: "green" },
  refunded: { label: "Refunded", tone: "grey" },
};

const REFUND_REASON: Record<string, string> = { expired: "No Leader answered in time", passed: "Every Leader passed" };

/**
 * Leader Reviews: members pay for a Leader's read on their thread. Reported
 * ones come first; finance staff can refund a written review, which also
 * takes the Leader's pay back.
 */
export default function ReviewsPage() {
  const [filter, setFilter] = useState<"" | ReviewRow["status"]>("");
  const list = useAdminData<ReviewRow[]>(`reviews${filter ? `?status=${filter}` : ""}`);
  const [openId, setOpenId] = useState<string | null>(null);
  const rows = list.data ?? [];
  const sel = rows.find((r) => r.id === openId) ?? rows[0];

  return (
    <>
      <PageHeader title="Leader Reviews" sub="Paid reviews of members' threads. Reported ones first." />
      <div className="mb-3 flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <Chip key={f.id} on={filter === f.id} onClick={() => setFilter(f.id)}>
            {f.label}
          </Chip>
        ))}
      </div>
      {list.error ? (
        <LoadError error={list.error} onRetry={list.reload} />
      ) : !list.data ? (
        <Loading rows={4} />
      ) : !rows.length ? (
        <Card className="max-w-[520px] rounded-2xl p-6 text-sm text-muted">No Leader Reviews here yet.</Card>
      ) : (
        <div className="grid max-w-[1100px] gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <div className="flex flex-col gap-2">
            {rows.map((r) => (
              <button
                key={r.id}
                onClick={() => setOpenId(r.id)}
                className={cx("flex flex-col gap-1 rounded-xl border bg-card px-4 py-3 text-left", sel?.id === r.id ? "border-orange" : "border-line")}
              >
                <span className="flex flex-wrap items-center gap-2">
                  <Badge tone={STATUS[r.status].tone}>{STATUS[r.status].label}</Badge>
                  {r.reported && r.status === "done" && <Badge tone="red">Reported</Badge>}
                  {r.helpful === false && !r.reported && <Badge tone="orange">Not helpful</Badge>}
                  <span className="text-xs text-muted">{ago(r.createdAt)}</span>
                </span>
                <span className="text-sm font-semibold">{r.thread?.title ?? "Deleted thread"}</span>
                <span className="text-xs text-muted">
                  {r.asker?.displayName ?? "Someone"} → {r.reviewer?.displayName ?? r.leader?.displayName ?? "any Leader"} · ✦ {r.price}
                </span>
              </button>
            ))}
          </div>
          {sel && <Detail key={sel.id} r={sel} onChanged={list.reload} />}
        </div>
      )}
    </>
  );
}

function Detail({ r, onChanged }: { r: ReviewRow; onChanged: () => void }) {
  const toast = useToast();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const refund = async () => {
    setBusy(true);
    try {
      await adminPost(`reviews/${r.id}/refund`, { note: note.trim() });
      toast(`Refunded ✦ ${r.price} to ${r.asker?.displayName ?? "the member"}. The Leader's pay was taken back.`);
      onChanged();
    } catch (e) {
      toast((e as AdminApiError).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="flex flex-col gap-4 rounded-2xl p-5">
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted">{r.thread?.where}</span>
        <span className="text-[17px] font-bold">{r.thread?.title ?? "Deleted thread"}</span>
        <span className="text-xs text-muted">
          Asked by {r.asker?.displayName ?? "someone"} {ago(r.createdAt)} · ✦ {r.price}
          {r.leader ? ` · sent to ${r.leader.displayName}` : " · open to any Leader in the Space"}
        </span>
      </div>
      {r.ask && <div className="rounded-xl border border-raised px-3 py-2 text-sm text-soft">“{r.ask}”</div>}
      {r.status === "open" && <span className="text-sm text-muted">Waiting. Due {new Date(r.dueAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}; refunded automatically if nobody answers.</span>}
      {r.status === "refunded" && (
        <span className="text-sm text-muted">
          Refunded {r.refundedAt ? ago(r.refundedAt) : ""}: {REFUND_REASON[r.refundReason] ?? r.refundReason}
        </span>
      )}
      {r.body && (
        <div className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold text-muted">
            {r.reviewer?.displayName ?? "The Leader"}&apos;s review{r.answeredAt ? ` · ${ago(r.answeredAt)}` : ""} · {r.body.length} characters
          </span>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{r.body}</p>
        </div>
      )}
      {r.reported && (
        <div className="rounded-xl border border-err bg-errbg px-3 py-2 text-sm">
          <span className="font-semibold text-err">Reported by the member{r.reportedAt ? ` ${ago(r.reportedAt)}` : ""}:</span> {r.reportNote}
        </div>
      )}
      {r.status === "done" && (
        <div className="flex flex-col gap-2 border-t border-raised pt-4">
          <Field label="Refund the member" hint="Takes the Leader's pay back too. Logged in the audit log and shown to the Leader.">
            <TextArea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Answered a different question." />
          </Field>
          <Button kind="danger" size="sm" className="self-start" disabled={note.trim().length < 5} loading={busy} onClick={refund}>
            Refund ✦ {r.price}
          </Button>
        </div>
      )}
    </Card>
  );
}
