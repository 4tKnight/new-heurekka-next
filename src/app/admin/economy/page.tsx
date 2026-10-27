"use client";

import { useState } from "react";

import { useConfirm } from "@/components/modal";
import { useToast } from "@/components/toast";
import { Button, Card, cx, fmt, Stepper } from "@/components/ui";
import { PageHeader } from "../admin-shell";
import { useAdmin } from "../admin-store";
import { adminPatch, useAdminData, type AdminApiError, type Economy, type SparksRules } from "../admin-api";
import { LoadError, Loading, PrototypeNote } from "../data-state";

const RULES: { id: keyof SparksRules; label: string; note: string; unit: string; step: number; min: number; max: number }[] = [
  { id: "answerAccepted", label: "Accepted answer", note: "Bonus when the asker accepts your answer.", unit: "✦", step: 1, min: 0, max: 100 },
  { id: "cheer", label: "Each cheer", note: "Bonus per cheer from someone other than the asker.", unit: "✦", step: 1, min: 0, max: 20 },
  { id: "cheerCapPerReply", label: "Cheer cap per reply", note: "Most cheers can pay on one reply.", unit: "✦", step: 1, min: 0, max: 200 },
  { id: "firstThread", label: "First thread in a Lab", note: "Bonus for the first thread in a new Lab.", unit: "✦", step: 1, min: 0, max: 100 },
  { id: "welcome", label: "Welcome bonus", note: "Once they've joined a Space and answered a question. Not at sign-up.", unit: "✦", step: 5, min: 0, max: 500 },
  { id: "dailyBonusCap", label: "Daily bonus cap", note: "Most bonus Sparks one person gets a day (Lagos time), welcome aside.", unit: "✦", step: 5, min: 0, max: 1000 },
  { id: "holdDays", label: "Hold on earned Sparks", note: "Days before tips and Leader pay can be cashed out.", unit: "days", step: 1, min: 0, max: 90 },
  { id: "reviewPrice", label: "Leader Review price", note: "What a member pays for a Leader to review their thread.", unit: "✦", step: 10, min: 10, max: 5000 },
  { id: "reviewPay", label: "Leader Review pay", note: "What the Leader earns for writing one, after the hold.", unit: "✦", step: 5, min: 0, max: 5000 },
  { id: "reviewHours", label: "Leader Review deadline", note: "Hours to answer before the member is refunded.", unit: "hours", step: 12, min: 12, max: 336 },
  { id: "creatorShare", label: "Creator share", note: "What a Leader keeps from each Shop sale. The rest is Heurekka's.", unit: "%", step: 5, min: 0, max: 100 },
  { id: "reviewedItems", label: "Items checked before listing", note: "A creator's first this-many items wait for staff review.", unit: "items", step: 1, min: 0, max: 50 },
  { id: "reportDays", label: "Refund window", note: "Days a buyer has to report a problem.", unit: "days", step: 1, min: 1, max: 60 },
  { id: "fixDays", label: "Creator fix window", note: "Days the creator has to fix it before the buyer is refunded.", unit: "days", step: 1, min: 1, max: 30 },
];

/**
 * Sparks in circulation, what moved this week, and the earning rules. Rules
 * apply within a minute, with no app release. Only admins can change them.
 */
export default function EconomyPage() {
  const a = useAdmin();
  const d = useAdminData<Economy>("economy");
  const isAdmin = a.me?.staffRole === "admin";
  return (
    <>
      <PageHeader title="Economy settings" sub="Sparks in circulation, and how people earn them." />
      {d.error ? <LoadError error={d.error} onRetry={d.reload} /> : !d.data ? <Loading rows={7} /> : <Body eco={d.data} isAdmin={isAdmin} onSaved={d.reload} />}
    </>
  );
}

function Body({ eco, isAdmin, onSaved }: { eco: Economy; isAdmin: boolean; onSaved: () => void }) {
  const ask = useConfirm();
  const toast = useToast();
  const [draft, setDraft] = useState<SparksRules>(eco.rules);
  const [saving, setSaving] = useState(false);
  const changed = RULES.filter((r) => draft[r.id] !== eco.rules[r.id]);
  const out = eco.outstanding;

  const save = async () => {
    const lines = changed.map((r) => `${r.label}: ${eco.rules[r.id]} → ${draft[r.id]} ${r.unit}`);
    const ok = await ask({
      title: `Save ${changed.length} ${changed.length === 1 ? "change" : "changes"}?`,
      body: (
        <span className="flex flex-col gap-2">
          <span className="flex flex-col gap-0.5">
            {lines.map((l) => (
              <span key={l} className="mono text-[13px] text-ink">
                {l}
              </span>
            ))}
          </span>
          <span>Applies within a minute. Sparks already given stay as they are.</span>
        </span>
      ),
      confirm: "Save changes",
    });
    if (!ok) return;
    setSaving(true);
    try {
      setDraft(await adminPatch<SparksRules>("sparks-rules", Object.fromEntries(changed.map((r) => [r.id, draft[r.id]]))));
      toast("Saved. It's in the audit log.");
      onSaved();
    } catch (e) {
      toast((e as AdminApiError).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="flex max-w-[760px] flex-col gap-2 pb-24">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(170px,1fr))] gap-2.5">
          {[
            ["In wallets", out.earned + out.bought + out.bonus, "All Sparks people hold"],
            ["Earned", out.earned, "From tips; cashable after the hold"],
            ["Bonus", out.bonus, "From Heurekka; Shop only"],
            ["Tips this week", eco.tipsThisWeek.sparks, `${fmt(eco.tipsThisWeek.count)} ${eco.tipsThisWeek.count === 1 ? "tip" : "tips"}`],
          ].map(([label, v, note]) => (
            <Card key={label as string} className="flex flex-col gap-1 rounded-xl px-4 py-3.5">
              <span className="text-xs text-muted">{label}</span>
              <span className="mono text-[22px] text-gold-ink">✦ {fmt(v as number)}</span>
              <span className="text-xs text-muted">{note}</span>
            </Card>
          ))}
        </div>
        {eco.thisWeek.length > 0 && (
          <Card className="flex flex-col gap-1.5 rounded-xl px-4 py-3.5">
            <span className="text-[13px] font-semibold text-muted">Given this week</span>
            {eco.thisWeek.map((k) => (
              <div key={k.kind} className="flex items-center justify-between text-sm">
                <span>
                  {k.label} <span className="text-muted">· {fmt(k.count)}</span>
                </span>
                <span className="mono text-gold-ink">✦ {fmt(k.sparks)}</span>
              </div>
            ))}
          </Card>
        )}

        <span className="mt-4 text-[13px] font-semibold text-muted">How people earn Sparks</span>
        {RULES.map((r) => {
          const v = draft[r.id];
          const dirty = v !== eco.rules[r.id];
          return (
            <div key={r.id} className={cx("flex flex-wrap items-center gap-3.5 rounded-xl border bg-card px-4 py-3.5", dirty ? "border-orange" : "border-line")}>
              <div className="flex flex-[1_1_260px] flex-col gap-0.5">
                <span className="text-sm font-semibold">{r.label}</span>
                <span className="text-xs text-muted">{dirty ? `Currently ${eco.rules[r.id]} ${r.unit}. Unsaved.` : r.note}</span>
              </div>
              <Stepper
                value={v}
                unit={r.unit}
                disabled={!isAdmin || saving}
                onDec={() => v - r.step >= r.min && setDraft((x) => ({ ...x, [r.id]: v - r.step }))}
                onInc={() => v + r.step <= r.max && setDraft((x) => ({ ...x, [r.id]: v + r.step }))}
              />
            </div>
          );
        })}
        <span className="text-xs text-muted">{isAdmin ? "Every change is logged in the audit log." : "Only admins can change these."}</span>
        <div className="mt-4 flex flex-col gap-1.5">
          <PrototypeNote>Coming with payments</PrototypeNote>
          <span className="text-xs text-muted">The payout rate, minimum payout, Shop creator share and Quest fee arrive with buying Sparks and cashing out.</span>
        </div>
      </div>
      {isAdmin && (
        <div className="sticky bottom-0 -mx-4 mt-auto flex max-w-[calc(760px+2rem)] flex-wrap items-center justify-between gap-3 border-t border-line bg-ground/95 px-4 py-3 backdrop-blur md:-mx-8 md:px-8">
          <span className="text-sm text-muted">{changed.length ? `${changed.length} unsaved ${changed.length === 1 ? "change" : "changes"}` : "All changes saved"}</span>
          <div className="flex gap-2">
            <Button disabled={!changed.length || saving} onClick={() => setDraft(eco.rules)}>
              Discard
            </Button>
            <Button kind="primary" disabled={!changed.length} loading={saving} onClick={save}>
              Save changes
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
