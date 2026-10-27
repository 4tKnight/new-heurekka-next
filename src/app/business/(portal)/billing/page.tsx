"use client";

import { useToast } from "@/components/toast";
import { Button, cx, naira } from "@/components/ui";
import { MIN_TOPUP, heldFor } from "@/lib/business-data";
import { useBusiness } from "../../business-store";
import { PortalHeader, pickClass } from "../portal-shell";

const COLS = "grid-cols-[1fr_2.2fr_1.2fr_1fr_0.8fr]";

export default function BillingPage() {
  const b = useBusiness();
  const toast = useToast();
  const held = b.campaigns.reduce((a, c) => a + heldFor(c), 0);

  const requestInvoice = () => {
    b.set((s) => ({ invoices: [{ date: "Today", desc: `Bank transfer top-up · INV-${1000 + s.invoices.length}`, amount: s.topup, status: "Waiting for transfer" }, ...s.invoices] }));
    toast(`Invoice for ${naira(b.topup)} sent to ${b.biz.email}.`);
  };

  return (
    <>
      <PortalHeader title="Billing" sub="Prepaid balance, cards, invoices and receipts. All amounts in naira." />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] items-start gap-3">
        <section className="flex flex-col gap-3 rounded-2xl border border-line bg-card p-[18px]">
          <h2 className="text-[15px] font-semibold">Balance</h2>
          {[
            ["Prepaid balance", b.balance],
            ["Held for live Quests", held],
            ["Available", Math.max(0, b.balance - held)],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-3 text-sm">
              <span className="text-muted">{k}</span>
              <span className="mono">{naira(v as number)}</span>
            </div>
          ))}
          <span className="pt-1.5 text-[13px] font-semibold">Add funds by bank transfer</span>
          <div className="flex flex-wrap gap-1.5">
            {[MIN_TOPUP, 2_000_000, 5_000_000].map((v) => (
              <button key={v} type="button" aria-pressed={b.topup === v} onClick={() => b.set({ topup: v })} className={cx("tap mono flex min-h-10 items-center rounded-full border px-3.5 text-[13px]", pickClass(b.topup === v))}>
                {naira(v)}
              </button>
            ))}
          </div>
          <Button kind="primary" className="self-start" onClick={requestInvoice}>
            Get invoice
          </Button>
          <span className="text-xs leading-normal text-muted">Minimum {naira(MIN_TOPUP)}. Funds usually land the same day. Invoices include VAT at 7.5% and your CAC number.</span>
        </section>
        <section className="flex flex-col gap-2.5 rounded-2xl border border-line bg-card p-[18px]">
          <h2 className="text-[15px] font-semibold">Payment methods</h2>
          {b.cards.map((c, i) => (
            <div key={c.last} className="flex min-h-14 items-center gap-3 rounded-xl border border-line px-3 py-2">
              <span className="mono flex h-7 w-10 shrink-0 items-center justify-center rounded-md bg-raised text-[10px]">{c.brand}</span>
              <div className="flex flex-1 flex-col">
                <span className="mono text-sm">•••• {c.last}</span>
                <span className="text-xs text-muted">{c.note}</span>
              </div>
              {c.def ? (
                <span className="text-[13px] font-semibold text-muted">Default</span>
              ) : (
                <button type="button" onClick={() => b.set((s) => ({ cards: s.cards.map((x, j) => ({ ...x, def: j === i })) }))} className="tap text-[13px] font-semibold text-lift">
                  Make default
                </button>
              )}
            </div>
          ))}
          <span className="text-xs leading-normal text-muted">Cards are charged in naira through Paystack. Live Quests hold their budget on the default card or your prepaid balance, whichever you choose at launch.</span>
        </section>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[15px] font-semibold">Invoices and receipts</h2>
        <Button size="sm" onClick={() => toast(`Exported ${b.invoices.length} rows as CSV.`)}>
          Export CSV
        </Button>
      </div>
      {b.invoices.length ? (
        <div className="overflow-x-auto rounded-2xl border border-line">
          <div className="min-w-[640px]">
            <div className={cx("grid gap-2.5 border-b border-line px-4 py-3 text-[11px] font-semibold tracking-[0.08em] text-muted uppercase", COLS)}>
              <span>Date</span>
              <span>Description</span>
              <span>Amount</span>
              <span>Status</span>
              <span />
            </div>
            {b.invoices.map((inv, i) => (
              <div key={i} className={cx("grid min-h-[52px] items-center gap-2.5 border-b border-raised px-4 text-[13px] last:border-b-0", COLS)}>
                <span className="mono text-muted">{inv.date}</span>
                <span>{inv.desc}</span>
                <span className="mono">{inv.amount ? naira(inv.amount) : "–"}</span>
                <span className={/Waiting/.test(inv.status) ? "text-lift" : "text-muted"}>{inv.status}</span>
                <button type="button" onClick={() => toast(`Downloading ${inv.desc.split(" · ")[0].toLowerCase()} PDF.`)} className="tap justify-self-start text-[13px] font-semibold text-lift">
                  PDF
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <span className="text-sm text-muted">No invoices yet. They appear here after your first top-up or Quest charge.</span>
      )}
    </>
  );
}
