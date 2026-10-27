"use client";

import { useState } from "react";

import { useToast } from "@/components/toast";
import { Button, Chip, Field, fmt, Input, TextArea } from "@/components/ui";
import { useAdmin } from "../admin-store";
import { adminPost, ago, type AdminApiError, type SparkEntry, type SparksRecord } from "../admin-api";

const BUCKETS: { id: SparkEntry["bucket"]; label: string }[] = [
  { id: "earned", label: "Earned" },
  { id: "bought", label: "Bought" },
  { id: "bonus", label: "Bonus" },
];

/**
 * Sparks on a user's admin page: the balance by kind, recent movements, and
 * (finance and admins) a correction with a logged reason.
 */
export function SparksPanel({ userId, name, record, onChanged }: { userId: string; name: string; record: SparksRecord; onChanged: () => void }) {
  const a = useAdmin();
  const toast = useToast();
  const canAdjust = a.me?.staffRole === "finance" || a.me?.staffRole === "admin";
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [bucket, setBucket] = useState<SparkEntry["bucket"]>("bonus");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const b = record.balance;
  const n = Number(amount);
  const valid = Number.isInteger(n) && n !== 0 && note.trim().length >= 5;

  const submit = async () => {
    setBusy(true);
    try {
      await adminPost(`users/${userId}/sparks`, { amount: n, bucket, note: note.trim() });
      toast(n > 0 ? `Added ✦ ${fmt(n)} to ${name}. They've been told.` : `Took ✦ ${fmt(-n)} from ${name}.`);
      setOpen(false);
      setAmount("");
      setNote("");
      onChanged();
    } catch (e) {
      toast((e as AdminApiError).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 border-t border-raised pt-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[13px] font-semibold text-muted">Sparks</span>
        <span className="mono text-sm text-gold-ink">✦ {fmt(b.total)}</span>
        <span className="text-xs text-muted">
          {fmt(b.earned)} earned ({fmt(b.onHold)} on hold) · {fmt(b.bought)} bought · {fmt(b.bonus)} bonus
        </span>
      </div>
      {record.recent.length > 0 ? (
        <div className="flex flex-col gap-1">
          {record.recent.slice(0, 8).map((e) => (
            <div key={e.id} className="flex items-baseline gap-3 text-[13px]">
              <span className={e.amount < 0 ? "mono w-16 shrink-0 text-muted" : "mono w-16 shrink-0 text-gold-ink"}>
                {e.amount > 0 ? "+" : "−"}✦ {fmt(Math.abs(e.amount))}
              </span>
              <span className="min-w-0 flex-1 truncate">
                {e.label}
                {e.note ? <span className="text-muted"> · {e.note}</span> : null}
              </span>
              <span className="shrink-0 text-xs text-muted">
                {e.bucket} · {ago(e.createdAt)}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <span className="text-xs text-muted">No Sparks yet.</span>
      )}
      {canAdjust &&
        (open ? (
          <div className="flex max-w-[520px] flex-col gap-3 rounded-xl border border-raised p-3.5">
            <Field label="Amount" hint="Negative takes Sparks away. Never below zero.">
              <Input inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d-]/g, ""))} placeholder="e.g. 20 or -5" />
            </Field>
            <div className="flex flex-wrap gap-1.5">
              {BUCKETS.map((x) => (
                <Chip key={x.id} on={bucket === x.id} onClick={() => setBucket(x.id)}>
                  {x.label}
                </Chip>
              ))}
            </div>
            <Field label="Why" hint="Logged in the audit log. Shown to them when adding.">
              <TextArea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Refund for a tip sent by mistake." />
            </Field>
            <div className="flex gap-2">
              <Button kind="primary" size="sm" disabled={!valid} loading={busy} onClick={submit}>
                {n < 0 ? "Take Sparks" : "Add Sparks"}
              </Button>
              <Button size="sm" disabled={busy} onClick={() => setOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button size="sm" className="self-start" onClick={() => setOpen(true)}>
            Adjust Sparks
          </Button>
        ))}
    </div>
  );
}
