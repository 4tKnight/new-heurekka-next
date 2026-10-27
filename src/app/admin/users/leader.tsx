"use client";

import { useConfirm } from "@/components/modal";
import { useToast } from "@/components/toast";
import { Badge, Button } from "@/components/ui";
import { useAdmin } from "../admin-store";
import { adminDelete, adminPost, type AdminApiError, type LeaderPath, type LeaderRecord } from "../admin-api";

/** The four criteria, as a compact checklist. */
export function Criteria({ path }: { path: LeaderPath }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(170px,1fr))] gap-2">
      {path.criteria.map((c) => (
        <div key={c.key} className="flex flex-col gap-1 rounded-xl border border-raised px-3 py-2">
          <span className="text-xs text-muted">{c.label}</span>
          <span className={c.done ? "text-sm font-semibold text-ok" : "text-sm font-semibold"}>
            {c.done ? "✓ " : ""}
            {c.goal === 1 ? (c.done ? "Clear" : "Flagged") : `${c.current} / ${c.goal}`}
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * Leader status on a user's admin page: progress, promotion (or founding
 * Leader for invited experts), removal, and the manual identity check.
 */
export function LeaderPanel({ userId, name, record, onChanged }: { userId: string; name: string; record: LeaderRecord; onChanged: () => void }) {
  const a = useAdmin();
  const ask = useConfirm();
  const toast = useToast();
  const isAdmin = a.me?.staffRole === "admin";
  const leader = record.role === "leader";

  const run = async (fn: () => Promise<unknown>, done: string) => {
    try {
      await fn();
      toast(done);
      onChanged();
    } catch (e) {
      toast((e as AdminApiError).message);
    }
  };

  return (
    <div className="flex flex-col gap-3 border-t border-raised pt-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[13px] font-semibold text-muted">Leader</span>
        {leader ? <Badge tone="gold">Leader{record.since ? ` since ${new Date(record.since).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}` : ""}</Badge> : <Badge>Member</Badge>}
        {leader && <span className="text-xs text-muted">{record.followers} followers</span>}
        {record.identityVerified ? <Badge tone="green">Identity verified</Badge> : leader ? <Badge tone="grey">Identity not verified</Badge> : null}
        {!leader && <span className="text-xs text-muted">{record.endorsements} Leader endorsements</span>}
      </div>
      {record.path && <Criteria path={record.path} />}
      {isAdmin ? (
        <div className="flex flex-wrap gap-2">
          {!leader && record.path?.allMet && (
            <Button kind="primary" size="sm" onClick={() => run(() => adminPost(`users/${userId}/leader`, {}), `${name} is a Leader now. They've been told.`)}>
              Make Leader
            </Button>
          )}
          {!leader && (
            <Button
              size="sm"
              onClick={async () => {
                if (await ask({ title: `Make ${name} a founding Leader?`, body: "For invited experts: skips the four criteria. They can start Spaces, have followers and appear in Search. Logged in the audit log.", confirm: "Make founding Leader" }))
                  await run(() => adminPost(`users/${userId}/leader`, { founding: true }), `${name} is a founding Leader now.`);
              }}
            >
              Make founding Leader
            </Button>
          )}
          {leader && (
            <Button
              size="sm"
              onClick={() => run(() => adminPost(`users/${userId}/identity`, { verified: !record.identityVerified }), record.identityVerified ? "Identity verification cleared." : "Marked as verified. Their profile shows it now.")}
            >
              {record.identityVerified ? "Clear identity check" : "Mark identity verified"}
            </Button>
          )}
          {leader && (
            <Button
              size="sm"
              kind="danger"
              onClick={async () => {
                if (await ask({ title: `Remove ${name}'s Leader status?`, body: "They lose followers' updates, Search visibility and creating Spaces. Spaces they started stay.", confirm: "Remove", danger: true }))
                  await run(() => adminDelete(`users/${userId}/leader`), "Leader status removed.");
              }}
            >
              Remove Leader status
            </Button>
          )}
        </div>
      ) : (
        <span className="text-xs text-muted">Only admins can make or remove Leaders.</span>
      )}
      {leader && !record.identityVerified && isAdmin && <span className="text-xs text-muted">Check their ID (NIN, passport, driver&apos;s licence or voter&apos;s card) with them directly, then mark it here.</span>}
    </div>
  );
}
