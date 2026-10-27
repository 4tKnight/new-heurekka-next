"use client";

import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui";
import { useAdminData, type LeaderCandidate } from "../admin-api";
import { LoadError, Loading } from "../data-state";
import { Criteria } from "../users/leader";

/**
 * Members on their way to Leader (anyone with a Leader endorsement),
 * readiest first. Those meeting all four can be confirmed from their page.
 */
export function LeaderCandidates() {
  const router = useRouter();
  const list = useAdminData<LeaderCandidate[]>("leader-candidates");
  if (list.error) return <LoadError error={list.error} onRetry={list.reload} />;
  if (!list.data) return <Loading rows={2} />;
  if (!list.data.length)
    return (
      <div className="flex max-w-[1180px] flex-col gap-1.5 rounded-xl border border-dashed border-line px-5 py-7 text-center">
        <span className="text-[15px] font-semibold">No candidates yet</span>
        <span className="text-[13px] text-muted">Members show up here once a Leader endorses them. Founding Leaders can be made from any user&apos;s page.</span>
      </div>
    );
  return (
    <div className="flex max-w-[1180px] flex-col gap-2.5">
      <span className="text-[13px] text-muted">Confirm new Leaders on the first Monday of each month. Open someone to make them a Leader.</span>
      {list.data.map((c) => (
        <button key={c.id} type="button" onClick={() => router.push(`/admin/users?u=${c.id}`)} className="flex flex-col gap-2.5 rounded-xl border border-line bg-card px-4 py-3.5 text-left hover:border-soft">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold">{c.name}</span>
            <span className="text-[13px] text-muted">@{c.handle}</span>
            {c.path.allMet ? <Badge tone="green">Ready to confirm</Badge> : <Badge tone="gold">{c.path.met} of 4</Badge>}
          </div>
          <Criteria path={c.path} />
        </button>
      ))}
    </div>
  );
}
