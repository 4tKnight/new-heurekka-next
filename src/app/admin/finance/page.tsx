"use client";

import Link from "next/link";
import { useState } from "react";

import { useConfirm } from "@/components/modal";
import { Badge, Button, Chip, fmt, naira, SearchInput, SectionLabel } from "@/components/ui";
import { FAILED, HOLDS, type FailedTxn } from "@/lib/admin-data";
import { PageHeader } from "../admin-shell";
import { useAdmin } from "../admin-store";

/** What fixing each kind of failure means. The first is the main action. */
const FIXES: Record<FailedTxn["kind"], [string, string, string][]> = {
  "Sparks purchase": [
    ["Credit Sparks", "The Sparks they paid for are added to their balance now.", "Sparks credited"],
    ["Refund charge", "The charge is reversed to their card in 3–5 business days.", "Charge refunded"],
  ],
  Payout: [
    ["Retry payout", "The transfer is sent again to the same bank account.", "Payout retried"],
    ["Ask for new bank details", "Their Sparks go back to their balance and they're asked to update their payout account.", "Asked for new bank details"],
  ],
  Refund: [
    ["Retry refund", "The refund is sent again to the card on file.", "Refund retried"],
    ["Refund by bank transfer", "The advertiser is asked for bank details and the refund is sent by transfer.", "Bank details requested"],
  ],
  "Quest card hold": [
    ["Retry hold", "The advertiser is asked to approve the hold again. The Quest stays paused until it succeeds.", "Hold retried · advertiser notified"],
  ],
};

/** Quest budgets are set and held in naira. Advertisers pay only for verified completions plus the fee on them. */
export default function FinancePage() {
  const a = useAdmin();
  const ask = useConfirm();
  const [fixed, setFixed] = useState<Record<string, string>>({});
  const [kind, setKind] = useState<string>("All");
  const [q, setQ] = useState("");
  const rate = a.econ.find((e) => e.id === "rate")!.value;
  const n = (sparks: number) => naira(sparks * 160);
  const heldNow = HOLDS.filter((h) => h.status === "Running").reduce((s, h) => s + h.held - h.spent, 0);
  const due = HOLDS.filter((h) => h.status === "Ended" && !a.refunded[h.id]).reduce((s, h) => s + h.held - h.spent, 0);
  const open = FAILED.filter((f) => !fixed[f.id]);
  const chargedOpen = open.filter((f) => f.charged).length;
  const stats = [
    { label: "Held on advertiser cards", value: n(heldNow), note: "Running Quests, not yet spent" },
    { label: "Refunds due", value: n(due), note: due ? "From Quests that have ended" : "All refunds issued" },
    { label: "Failed transactions", value: fmt(open.length), note: chargedOpen ? `${chargedOpen} charged with nothing delivered` : open.length ? "None charged without delivery" : "All resolved", alert: chargedOpen > 0 },
    { label: "Payouts sent this month", value: n(12840), note: "To 23 creators" },
    { label: "Fees earned this month", value: n(4125), note: "Quest fees and Shop share" },
    { label: "Cashable Sparks", value: `✦ ${fmt(48200)}`, note: `${naira(48200 * rate)} if all cashed out` },
  ];

  const needle = q.trim().toLowerCase();
  // Charged-but-undelivered first, then newest.
  const failed = FAILED.filter((f) => (kind === "All" || f.kind === kind) && (!needle || `${f.who} ${f.ref} ${f.detail} ${f.reason}`.toLowerCase().includes(needle))).sort((x, y) => Number(!!fixed[x.id]) - Number(!!fixed[y.id]) || Number(!!y.charged) - Number(!!x.charged));

  const fix = async (f: FailedTxn, [label, body, msg]: [string, string, string]) => {
    if (!(await ask({ title: `${label}?`, body: `${naira(f.amount)} · ${f.who} · ${f.detail}. ${body}`, confirm: label }))) return;
    setFixed((s) => ({ ...s, [f.id]: msg }));
    a.act({ what: label, target: `${f.kind} ${f.ref} · ${f.who}`, msg });
  };

  return (
    <>
      <PageHeader title="Finance" sub="Quest budgets held on cards, refunds, payouts, fees, and failed transactions." />
      <div className="flex max-w-[1040px] flex-col gap-6">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-2.5">
          {stats.map((s) => (
            <div key={s.label} className={`flex flex-col gap-1.5 rounded-xl border bg-card p-4 ${s.alert ? "border-err" : "border-line"}`}>
              <span className="text-xs text-muted">{s.label}</span>
              <span className={`mono text-[21px] ${s.alert ? "text-err" : ""}`}>{s.value}</span>
              <span className="text-xs text-muted">{s.note}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <SectionLabel>Failed transactions</SectionLabel>
            <span className="text-xs text-muted">From Paystack webhooks and transfer callbacks. Members are emailed automatically when a payment fails.</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {["All", ...Object.keys(FIXES)].map((k) => (
              <Chip key={k} on={kind === k} onClick={() => setKind(k)}>
                {k}
                {k !== "All" && <span className="mono ml-1.5 text-[11px] opacity-70">{open.filter((f) => f.kind === k).length}</span>}
              </Chip>
            ))}
            <SearchInput value={q} onChange={setQ} placeholder="Search name or reference" className="ml-auto w-full sm:w-[260px]" />
          </div>
          <div className="flex flex-col overflow-hidden rounded-xl border border-line">
            {failed.map((f) => {
              const done = fixed[f.id];
              const [main, ...rest] = FIXES[f.kind];
              return (
                <div key={f.id} className={`flex flex-wrap items-center gap-x-4 gap-y-2.5 border-b border-raised bg-card px-4 py-3.5 last:border-b-0 ${done ? "opacity-60" : ""}`}>
                  <div className="flex min-w-0 flex-[1_1_380px] flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={done ? "green" : f.charged ? "red" : "orange"}>{done ? "Resolved" : f.charged ? "Charged, not delivered" : "Failed"}</Badge>
                      <span className="text-xs text-muted">{f.kind}</span>
                      <span className="mono text-[11px] text-muted">
                        {f.ref} · {f.when} ago · {f.attempts} {f.attempts === 1 ? "attempt" : "attempts"}
                      </span>
                    </div>
                    <span className="text-sm font-semibold leading-snug">
                      {naira(f.amount)} · {f.who} · {f.detail}
                    </span>
                    <span className="text-[13px] leading-snug text-soft">{done ?? f.reason}</span>
                  </div>
                  {!done && (
                    <div className="flex flex-wrap items-center gap-2">
                      <Button kind="primary" size="sm" onClick={() => fix(f, main)}>
                        {main[0]}
                      </Button>
                      {rest.map((r) => (
                        <Button key={r[0]} size="sm" onClick={() => fix(f, r)}>
                          {r[0]}
                        </Button>
                      ))}
                      {f.uid && (
                        <Link href={`/admin/users?u=${f.uid}`} className="px-1.5 text-[13px] font-semibold text-lift">
                          View user →
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {!failed.length && <span className="bg-card px-4 py-6 text-center text-sm text-muted">No failed transactions match.</span>}
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          <SectionLabel>Quest budgets</SectionLabel>
          <div className="flex flex-col overflow-x-auto rounded-xl border border-line">
            <div className="mono grid min-w-[640px] grid-cols-[minmax(0,2.4fr)_repeat(3,minmax(0,1fr))_minmax(0,1.4fr)] gap-3 bg-ground px-4 py-2.5 text-[10px] uppercase tracking-[0.1em] text-muted">
              <span>Quest</span>
              <span>Held</span>
              <span>Spent</span>
              <span>Left</span>
              <span />
            </div>
            {HOLDS.map((h) => {
              const left = h.held - h.spent;
              const refunded = !!a.refunded[h.id];
              const can = h.status === "Ended" && left > 0 && !refunded;
              return (
                <div key={h.id} className="grid min-h-14 min-w-[640px] grid-cols-[minmax(0,2.4fr)_repeat(3,minmax(0,1fr))_minmax(0,1.4fr)] items-center gap-3 border-t border-raised bg-card px-4 py-2">
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-sm font-semibold leading-snug">{h.title}</span>
                    <span className="text-xs text-muted">
                      {h.adv} · {refunded ? "Ended · refunded" : h.status}
                    </span>
                  </div>
                  <span className="mono text-[13px]">{n(h.held)}</span>
                  <span className="mono text-[13px]">{n(h.spent)}</span>
                  <span className="mono text-[13px]">{n(refunded ? 0 : left)}</span>
                  {can ? (
                    <Button
                      kind="primary"
                      size="sm"
                      className="justify-self-end"
                      onClick={async () => {
                        if (!(await ask({ title: "Issue refund?", body: `${n(left)} goes back to ${h.adv}'s card for "${h.title}". This can't be undone.`, confirm: "Issue refund" }))) return;
                        a.set((s) => ({ refunded: { ...s.refunded, [h.id]: true } }));
                        a.act({ what: "Issued refund", target: `${n(left)} to ${h.adv}`, msg: "Refund issued" });
                      }}
                    >
                      Issue refund
                    </Button>
                  ) : (
                    <span className="justify-self-end text-right text-xs text-muted">{refunded ? `Refunded ${n(left)}` : h.status === "Running" ? "Held until it ends" : "Nothing to refund"}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
