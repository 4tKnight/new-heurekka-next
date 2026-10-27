"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { Badge, Kicker, SearchInput, fmt, type Tone } from "@/components/ui";
import { PageHeader } from "../admin-shell";
import { SpaceTeam } from "./team";
import { useAdminData, type SpaceRow } from "../admin-api";
import { LoadError, Loading } from "../data-state";

export default function SpacesPage() {
  return (
    <Suspense>
      <Spaces />
    </Suspense>
  );
}

const weekPosts = (s: SpaceRow) => s.labs.reduce((n, l) => n + (l.archived ? 0 : l.threadsThisWeek), 0);

/** Quiet Spaces stand out: nobody posted this week. */
function health(s: SpaceRow): [string, Tone] {
  if (s.archived) return ["Archived", "grey"];
  if (!s.isPublic) return ["Private", "gold"];
  return weekPosts(s) ? ["Active", "green"] : ["Quiet this week", "orange"];
}

function Spaces() {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const list = useAdminData<SpaceRow[]>("spaces");
  const needle = q.trim().toLowerCase();
  const all = list.data ?? [];
  const shown = needle ? all.filter((s) => [s.name, s.slug, ...s.tags, ...s.labs.map((l) => l.name)].join(" ").toLowerCase().includes(needle)) : all;
  const selId = params.get("id") ?? shown.find((s) => !s.archived)?.id;
  const sel = all.find((s) => s.id === selId);

  return (
    <>
      <PageHeader title="Spaces and Leaders" sub="Every Space and its Labs, who runs it, and this week's activity. Leaders create Spaces in the app." />
      {list.error ? (
        <LoadError error={list.error} onRetry={list.reload} />
      ) : !list.data ? (
        <Loading rows={5} />
      ) : (
        <div className="flex max-w-[1180px] flex-wrap items-start gap-[18px]">
          <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-2">
            <SearchInput value={q} onChange={setQ} placeholder="Search Spaces and Labs" />
            {shown.map((s) => {
              const [label, tone] = health(s);
              const live = s.labs.filter((l) => !l.archived).length;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => router.replace(`/admin/spaces?id=${s.id}`, { scroll: false })}
                  className={`tap flex flex-col gap-[7px] rounded-xl border px-3.5 py-[13px] text-left ${s.id === sel?.id ? "border-orange bg-card" : "border-raised hover:border-line"} ${s.archived ? "opacity-60" : ""}`}
                >
                  <div className="flex items-center justify-between gap-2.5">
                    <Badge tone={tone}>{label}</Badge>
                    <span className="mono text-[11px] text-muted">{weekPosts(s)} posts this week</span>
                  </div>
                  <span className="text-sm font-semibold leading-snug">{s.name}</span>
                  <span className="text-xs text-muted">
                    {fmt(s.members)} {s.members === 1 ? "member" : "members"} · {live} {live === 1 ? "Lab" : "Labs"} · {s.team.find((m) => m.role === "owner")?.name ?? "no owner yet"}
                  </span>
                </button>
              );
            })}
            {!shown.length && <span className="rounded-xl border border-dashed border-line px-5 py-7 text-center text-[15px] font-semibold">Nothing matches &ldquo;{q.trim()}&rdquo;</span>}
          </div>
          {sel && (
            <div key={sel.id} className="rise flex min-w-0 flex-[2_1_420px] flex-col gap-[18px] rounded-2xl border border-line bg-card p-[22px]">
              <div className="flex flex-col gap-1.5">
                <Kicker>{sel.isPublic ? "Public Space" : "Private Space"} · {sel.slug}</Kicker>
                <h2 className="text-[21px] font-bold leading-tight tracking-[-0.02em]">{sel.name}</h2>
                <span className="text-[13px] text-muted">{sel.description}</span>
              </div>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-x-[18px] gap-y-3">
                {(
                  [
                    ["Members", fmt(sel.members)],
                    ["Labs", String(sel.labs.filter((l) => !l.archived).length)],
                    ["Posts this week", String(weekPosts(sel))],
                    ["Matches interests", sel.tags.join(", ") || "—"],
                  ] as const
                ).map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-[3px]">
                    <span className="text-xs text-muted">{k}</span>
                    <span className="text-sm font-medium">{v}</span>
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[13px] font-semibold text-muted">Labs</span>
                {sel.labs.map((l) => (
                  <div key={l.id} className={`flex flex-wrap items-baseline gap-x-3 gap-y-0.5 border-b border-raised py-[10px] last:border-b-0 ${l.archived ? "opacity-55" : ""}`}>
                    <span className="min-w-0 flex-1 text-sm font-medium">
                      {l.title}
                      {l.inviteOnly && <span className="text-muted"> · invite-only</span>}
                      {l.archived && <span className="text-muted"> · archived</span>}
                    </span>
                    <span className="mono text-xs text-muted">
                      {fmt(l.members)} members · {fmt(l.threads)} posts · {l.threadsThisWeek} this week
                    </span>
                  </div>
                ))}
              </div>
              <SpaceTeam spaceId={sel.id} team={sel.team} onChanged={list.reload} />
            </div>
          )}
        </div>
      )}
    </>
  );
}
