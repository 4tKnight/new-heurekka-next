"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { Badge, Kicker, SearchInput, fmt, type Tone } from "@/components/ui";
import { PageHeader } from "../admin-shell";
import { ago, useAdminData, type UserDetail, type UserRow } from "../admin-api";
import { LoadError, Loading } from "../data-state";
import { LeaderPanel } from "./leader";
import { ModerationPanel } from "./moderation";
import { SparksPanel } from "./sparks";

const PAGE = 20;
const TONE: Record<UserRow["status"], Tone> = { Active: "green", "Signing up": "gold", Deleting: "red" };
const KIND: Record<string, string> = { ask: "Ask the room", feedback: "Get feedback", showcase: "Show what I built", discussion: "Discussion", opportunity: "Opportunity" };

function Users() {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [term, setTerm] = useState(q.trim());
  const [offset, setOffset] = useState(0);
  const sel = params.get("u");

  // Search 300ms after typing stops.
  useEffect(() => {
    const t = setTimeout(() => {
      setTerm(q.trim());
      setOffset(0);
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const list = useAdminData<{ total: number; items: UserRow[] }>(`users?q=${encodeURIComponent(term)}&offset=${offset}&limit=${PAGE}`);
  const items = list.data?.items ?? [];
  const selected = sel ?? items[0]?.id ?? null;
  const open = (id: string) => router.replace(`/admin/users?u=${id}${term ? `&q=${encodeURIComponent(term)}` : ""}`, { scroll: false });

  return (
    <>
      <PageHeader title="Users" sub="Everyone with an account: who they are, how they sign in, and what they've posted." />
      {list.error ? (
        <LoadError error={list.error} onRetry={list.reload} />
      ) : (
        <div className="flex max-w-[1180px] flex-wrap items-start gap-[18px]">
          <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-2">
            <SearchInput value={q} onChange={setQ} placeholder="Search name, handle or email" />
            {!list.data ? (
              <Loading rows={5} />
            ) : (
              <>
                {items.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => open(u.id)}
                    className={`tap flex flex-col gap-[7px] rounded-xl border px-3.5 py-[13px] text-left ${u.id === selected ? "border-orange bg-card" : "border-raised hover:border-line"}`}
                  >
                    <div className="flex items-center justify-between gap-2.5">
                      <Badge tone={TONE[u.status]}>{u.isLeader ? "Leader" : u.status}</Badge>
                      <span className="mono text-[11px] text-muted">joined {ago(u.joinedAt)}</span>
                    </div>
                    <span className="text-sm font-semibold leading-snug">{u.name}</span>
                    <span className="text-xs text-muted">
                      @{u.handle} · {fmt(u.threads)} posts · {fmt(u.replies)} replies
                    </span>
                  </button>
                ))}
                {items.length === 0 && (
                  <div className="flex flex-col gap-1.5 rounded-xl border border-dashed border-line px-5 py-7 text-center">
                    <span className="text-[15px] font-semibold">{term ? `Nobody matches “${term}”` : "No accounts yet"}</span>
                    {term && (
                      <button type="button" onClick={() => setQ("")} className="text-[13px] font-semibold text-lift">
                        Clear search
                      </button>
                    )}
                  </div>
                )}
                {list.data.total > PAGE && (
                  <div className="flex items-center justify-between gap-2 pt-1 text-xs text-muted">
                    <span className="mono">
                      {offset + 1}–{Math.min(offset + PAGE, list.data.total)} of {fmt(list.data.total)}
                    </span>
                    <div className="flex gap-2">
                      <button type="button" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - PAGE))} className="min-h-9 px-2 font-semibold text-lift disabled:text-muted">
                        Previous
                      </button>
                      <button type="button" disabled={offset + PAGE >= list.data.total} onClick={() => setOffset(offset + PAGE)} className="min-h-9 px-2 font-semibold text-lift disabled:text-muted">
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          {selected && <Detail key={selected} id={selected} />}
        </div>
      )}
    </>
  );
}

function Detail({ id }: { id: string }) {
  const d = useAdminData<UserDetail>(`users/${id}`);
  if (d.error) return <LoadError error={d.error} onRetry={d.reload} />;
  const u = d.data;
  if (!u) return <div className="min-w-0 flex-[2_1_420px]"><Loading rows={3} /></div>;
  const facts: [string, string][] = [
    ["Email", u.email],
    ["Signs in with", u.signsInWith.join(", ") || "—"],
    ["Joined", ago(u.joinedAt)],
    ["Last active", ago(u.lastActiveAt)],
    ["Signed in on", `${u.devices} ${u.devices === 1 ? "device" : "devices"}`],
    ["Accepted answers", fmt(u.threadsWithAcceptedAnswer)],
    ["Friends", fmt(u.friends)],
    ["Friend requests sent this week", fmt(u.friendRequestsThisWeek)],
    ["Blocked by", u.blockedBy === 0 ? "No one" : `${fmt(u.blockedBy)} ${u.blockedBy === 1 ? "person" : "people"}`],
    ["Chats", fmt(u.chats)],
    ["Messages sent this week", fmt(u.messagesThisWeek)],
    ["Message requests this week", fmt(u.messageRequestsThisWeek)],
  ];
  return (
    <div className="rise flex min-w-0 flex-[2_1_420px] flex-col gap-[18px] rounded-2xl border border-line bg-card p-[22px]">
      <div className="flex items-center gap-3.5">
        {u.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={u.avatarUrl} alt="" className="h-14 w-14 rounded-full object-cover" />
        ) : (
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-raised text-lg font-bold">{u.name.slice(0, 1)}</span>
        )}
        <div className="flex min-w-0 flex-col gap-1">
          <Kicker>{u.isLeader ? "Leader" : u.status}</Kicker>
          <h2 className="text-[21px] font-bold leading-tight tracking-[-0.02em]">{u.name}</h2>
          <span className="text-[13px] text-muted">
            @{u.handle}
            {u.headline && ` · ${u.headline}`}
          </span>
        </div>
      </div>
      {u.bio && <div className="rounded-xl border border-raised bg-ground px-4 py-3.5 text-sm leading-relaxed text-soft">{u.bio}</div>}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-x-[18px] gap-y-3">
        {facts.map(([k, v]) => (
          <div key={k} className="flex flex-col gap-[3px]">
            <span className="text-xs text-muted">{k}</span>
            <span className="break-words text-sm font-medium">{v}</span>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-[13px] font-semibold text-muted">Spaces and interests</span>
        <div className="flex flex-wrap gap-1.5">
          {u.spaces.map((s) => (
            <Badge key={s.id}>{s.name}</Badge>
          ))}
          {u.interests.map((i) => (
            <span key={i} className="rounded-full border border-line px-2.5 py-1 text-xs text-muted">
              {i}
            </span>
          ))}
          {!u.spaces.length && !u.interests.length && <span className="text-[13px] text-muted">None yet.</span>}
        </div>
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-[13px] font-semibold text-muted">Recent posts</span>
        {u.recentThreads.map((t) => (
          <div key={t.id} className="flex flex-col gap-0.5 border-b border-raised py-[9px] last:border-b-0">
            <span className="text-sm">{t.title}</span>
            <span className="mono text-[11px] text-muted">
              {KIND[t.kind] ?? t.kind} · {t.where} · {t.replies} {t.replies === 1 ? "reply" : "replies"} · {ago(t.createdAt)}
            </span>
          </div>
        ))}
        {!u.recentThreads.length && <span className="py-1.5 text-[13px] text-muted">No posts yet.</span>}
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-[13px] font-semibold text-muted">Recent replies</span>
        {u.recentReplies.map((r) => (
          <div key={r.id} className="flex flex-col gap-0.5 border-b border-raised py-[9px] last:border-b-0">
            <span className="line-clamp-2 text-sm">{r.body || "(images or a clip)"}</span>
            <span className="mono text-[11px] text-muted">
              on “{r.threadTitle}” · {ago(r.createdAt)}
            </span>
          </div>
        ))}
        {!u.recentReplies.length && <span className="py-1.5 text-[13px] text-muted">No replies yet.</span>}
      </div>
      <LeaderPanel userId={u.id} name={u.name} record={u.leader} onChanged={d.reload} />
      <SparksPanel userId={u.id} name={u.name} record={u.sparks} onChanged={d.reload} />
      <ModerationPanel userId={u.id} name={u.name} record={u.moderation} liveBlocked={u.liveBlocked} buzzHosted={u.buzzHosted} onChanged={d.reload} />
    </div>
  );
}

export default function UsersPage() {
  return (
    <Suspense>
      <Users />
    </Suspense>
  );
}
