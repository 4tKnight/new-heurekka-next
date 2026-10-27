"use client";

import { useState } from "react";

import { Badge, Chip, type Tone } from "@/components/ui";
import { ago, useAdminData, type ClipRow } from "../admin-api";
import { LoadError, Loading } from "../data-state";

const STATUS: { key: ClipRow["status"]; label: string; tone: Tone; note: string }[] = [
  { key: "pending", label: "Under review", tone: "gold", note: "Waiting for Cloudinary's video moderation. Only the author sees these." },
  { key: "rejected", label: "Refused", tone: "red", note: "Refused by moderation and hidden. The video file was deleted." },
  { key: "approved", label: "Approved", tone: "green", note: "Visible to everyone. The 50 most recent." },
];

const length = (ms: number) => {
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

/**
 * Video clips on posts. Moderation is automatic (Cloudinary); this shows
 * what it's holding back or refused, so staff can keep an eye on it.
 */
export function ClipsQueue() {
  const [status, setStatus] = useState<ClipRow["status"]>("pending");
  const list = useAdminData<ClipRow[]>(`clips?status=${status}`);
  const s = STATUS.find((x) => x.key === status)!;
  return (
    <div className="flex max-w-[1180px] flex-col gap-3.5">
      <div className="flex flex-wrap items-center gap-2">
        {STATUS.map((x) => (
          <Chip key={x.key} on={x.key === status} onClick={() => setStatus(x.key)}>
            {x.label}
          </Chip>
        ))}
        <span className="text-[13px] text-muted">{s.note}</span>
      </div>
      {list.error ? (
        <LoadError error={list.error} onRetry={list.reload} />
      ) : !list.data ? (
        <Loading rows={2} />
      ) : !list.data.length ? (
        <div className="flex flex-col gap-1.5 rounded-xl border border-dashed border-line px-5 py-7 text-center">
          <span className="text-[15px] font-semibold">Nothing here</span>
          <span className="text-[13px] text-muted">New clips show up as people post them.</span>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3">
          {list.data.map((c) => (
            <div key={c.id} className="flex flex-col gap-2.5 rounded-xl border border-line bg-card p-3">
              {c.status === "rejected" ? (
                <div className="flex aspect-video items-center justify-center rounded-lg bg-raised text-[13px] text-muted">File deleted</div>
              ) : (
                <video src={c.url} poster={c.poster} controls preload="none" className="aspect-video w-full rounded-lg bg-black object-contain" />
              )}
              <div className="flex items-center justify-between gap-2">
                <Badge tone={s.tone}>{s.label}</Badge>
                <span className="mono text-[11px] text-muted">
                  {length(c.durationMs)} · {ago(c.createdAt)}
                </span>
              </div>
              <span className="text-sm font-semibold">{c.post ? `${c.post.isReply ? "Reply on" : "Post:"} “${c.post.title}”` : "Not attached to a post yet"}</span>
              <span className="text-xs text-muted">
                by {c.author.name} · @{c.author.handle}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
