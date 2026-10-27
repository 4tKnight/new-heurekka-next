"use client";

import { X } from "@phosphor-icons/react";
import { useState } from "react";

import { useToast } from "@/components/toast";
import { Button } from "@/components/ui";
import { MAX_TEAM, ROLES, domainOf, type RoleId } from "@/lib/business-data";
import { useBusiness } from "../../business-store";
import { PortalHeader } from "../portal-shell";

const selectCls = "h-10 rounded-[10px] border border-line bg-ground px-2.5 text-[13px] text-ink disabled:opacity-60";

export default function TeamPage() {
  const b = useBusiness();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<RoleId>("manager");
  const [err, setErr] = useState("");
  const domain = domainOf(b.biz.site);

  const invite = () => {
    const em = email.trim().toLowerCase();
    if (!em.endsWith("@" + domain)) return setErr(`Team members need an email ending in @${domain}.`);
    if (b.team.some((m) => m.email === em)) return setErr("They're already on the team.");
    if (b.team.length >= MAX_TEAM) return setErr(`Up to ${MAX_TEAM} people per account.`);
    const name = em
      .split("@")[0]
      .split(/[._]/)
      .filter(Boolean)
      .map((w) => w[0].toUpperCase() + w.slice(1))
      .join(" ");
    b.set((s) => ({ team: [...s.team, { name, email: em, role, status: "Invite sent" }] }));
    setEmail("");
    toast(`Invite sent to ${em}. It expires in 7 days.`);
  };

  return (
    <>
      <PortalHeader title="Team" sub={`People at ${b.biz.name} who can use this account.`} />
      <div className="flex max-w-[760px] flex-col gap-3">
        {b.team.map((m, i) => (
          <div key={m.email} className="flex min-h-16 flex-wrap items-center gap-3 rounded-[14px] border border-line bg-card px-3.5 py-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy text-xs font-bold text-white">
              {m.name
                .split(" ")
                .map((w) => w[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </span>
            <div className="flex flex-[1_1_180px] flex-col">
              <span className="text-sm font-semibold">{m.name}</span>
              <span className="text-xs text-muted">
                {m.email} · {m.status}
              </span>
            </div>
            {/* The account Admin who signed up can't demote themselves. */}
            <select value={m.role} disabled={i === 0} aria-label={`Role for ${m.name}`} onChange={(e) => b.set((s) => ({ team: s.team.map((x, j) => (j === i ? { ...x, role: e.target.value as RoleId } : x)) }))} className={selectCls}>
              {ROLES.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
            {i > 0 && (
              <button
                type="button"
                aria-label={`Remove ${m.name}`}
                onClick={() => {
                  b.set((s) => ({ team: s.team.filter((_, j) => j !== i) }));
                  toast(`${m.name} removed. They lose access straight away.`);
                }}
                className="tap flex h-10 w-10 items-center justify-center rounded-full text-muted hover:text-ink"
              >
                <X size={16} />
              </button>
            )}
          </div>
        ))}
        <form
          className="flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            invite();
          }}
        >
          <input
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setErr("");
            }}
            type="email"
            aria-label="Invite by email"
            placeholder={`name@${domain || "company.com"}`}
            className="h-11 flex-[1_1_240px] rounded-full border border-line bg-card px-3.5 text-sm text-ink"
          />
          <select value={role} onChange={(e) => setRole(e.target.value as RoleId)} aria-label="Role for invite" className="h-11 rounded-full border border-line bg-card px-3 text-sm text-ink">
            {ROLES.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
          <Button type="submit" kind="primary">
            Invite
          </Button>
        </form>
        {err && (
          <span role="alert" className="text-xs text-err">
            {err}
          </span>
        )}
        <div className="flex flex-col gap-1.5 rounded-[14px] bg-raised p-3.5">
          {ROLES.map((r) => (
            <span key={r.id} className="text-[13px] leading-normal">
              <span className="font-semibold">{r.label}</span> <span className="text-muted">{r.help}</span>
            </span>
          ))}
        </div>
      </div>
    </>
  );
}
