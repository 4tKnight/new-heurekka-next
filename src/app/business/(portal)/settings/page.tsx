"use client";

import { Toggle } from "@/components/ui";
import { domainOf } from "@/lib/business-data";
import { useBusiness } from "../../business-store";
import { PortalHeader } from "../portal-shell";

export default function BusinessSettingsPage() {
  const b = useBusiness();
  const rows = [
    ["Business name", b.biz.name],
    ["Website", domainOf(b.biz.site)],
    ["CAC number", b.biz.reg],
    ["Billing email", b.biz.email],
    ["Verification", b.verified ? "Verified" : "In progress"],
    ["Currency", "Naira (₦)"],
    ["Time zone", "WAT (UTC+1)"],
  ];
  return (
    <>
      <PortalHeader title="Business" sub="Your verified business details." />
      <div className="flex max-w-[640px] flex-col gap-1">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 border-b border-raised py-3.5 text-sm">
            <span className="text-muted">{k}</span>
            <span className="text-right">{v}</span>
          </div>
        ))}
        <span className="pt-2.5 text-[13px] leading-normal text-muted">Changing the business name or website sends your account back through verification. Live Quests keep running while we check.</span>
        <div className="flex min-h-14 items-center gap-3 pt-2">
          <Toggle on={b.weekly} onChange={(weekly) => b.set({ weekly })} label="Weekly results email" />
          <span className="flex flex-col gap-0.5">
            <span className="text-sm">Weekly results email</span>
            <span className="text-xs text-muted">Every Monday at 9:00 WAT, to every Admin and Analyst.</span>
          </span>
        </div>
      </div>
    </>
  );
}
