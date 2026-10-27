"use client";

import { useState } from "react";

import { useConfirm } from "@/components/modal";
import { useToast } from "@/components/toast";
import { Button, Chip, Field, fmt, Input, SectionLabel, TextArea } from "@/components/ui";
import { PageHeader } from "../admin-shell";
import { useAdmin } from "../admin-store";
import { adminPost, ago, useAdminData, type AdminApiError, type AnnouncementRow, type Overview, type SpaceRow } from "../admin-api";
import { LoadError, Loading } from "../data-state";

const TITLE_MAX = 80;
const BODY_MAX = 400;

/**
 * Announcements to everyone, or one Space's members. Each lands in the
 * in-app inbox (under Alerts), and as a push on phones that allow
 * announcements. Sent announcements can't be recalled.
 */
export default function AnnouncementsPage() {
  const a = useAdmin();
  const ask = useConfirm();
  const toast = useToast();
  const sent = useAdminData<{ pushReady: boolean; items: AnnouncementRow[] }>("announcements");
  const overview = useAdminData<Overview>("overview");
  const spaces = useAdminData<SpaceRow[]>("spaces");
  const [spaceId, setSpaceId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [err, setErr] = useState("");

  const canSend = a.me?.staffRole === "admin";
  const live = (spaces.data ?? []).filter((s) => !s.archived);
  const space = live.find((s) => s.id === spaceId);
  const reach = space ? space.members : overview.data?.totals.people;
  const push = sent.data?.pushReady;

  const send = async () => {
    if (title.trim().length < 3 || body.trim().length < 3) return setErr("Add a title and a message.");
    setErr("");
    const who = space ? `${space.name} members` : "everyone";
    if (!(await ask({ title: "Send this announcement?", body: `“${title.trim()}” goes to ${reach == null ? who : `${fmt(reach)} people (${who})`}. Sent announcements can't be recalled.`, confirm: "Send now" }))) return;
    try {
      const r = await adminPost<{ recipients: number; pushed: boolean }>("announcements", { title: title.trim(), body: body.trim(), ...(spaceId ? { spaceId } : {}) });
      toast(`Sent to ${fmt(r.recipients)} ${r.recipients === 1 ? "person" : "people"}${r.pushed ? ", with push" : ""}.`);
      setTitle("");
      setBody("");
      sent.reload();
    } catch (e) {
      setErr((e as AdminApiError).message);
    }
  };

  return (
    <>
      <PageHeader title="Announcements" sub="Messages to members in the app inbox and by push. Sent announcements can't be recalled." />
      <div className="flex max-w-[1180px] flex-wrap items-start gap-[18px]">
        <div className="flex min-w-0 flex-[2_1_420px] flex-col gap-4 rounded-2xl border border-line bg-card p-[22px]">
          <div className="flex flex-col gap-2">
            <SectionLabel>Audience</SectionLabel>
            <div className="flex flex-wrap gap-1.5">
              <Chip on={!spaceId} onClick={() => setSpaceId(null)}>
                Everyone
              </Chip>
              {live.map((s) => (
                <Chip key={s.id} on={spaceId === s.id} onClick={() => setSpaceId(s.id)}>
                  {s.name}
                </Chip>
              ))}
            </div>
          </div>
          <Field label={`Title · ${title.length}/${TITLE_MAX}`}>
            <Input value={title} maxLength={TITLE_MAX} onChange={(e) => setTitle(e.target.value)} placeholder="What's this about?" />
          </Field>
          <Field label={`Message · ${body.length}/${BODY_MAX}`} error={err || undefined}>
            <TextArea rows={4} value={body} maxLength={BODY_MAX} onChange={(e) => setBody(e.target.value)} placeholder="Keep it short: it has to fit a notification." />
          </Field>
          {(title || body) && (
            <div className="flex flex-col gap-1.5">
              <SectionLabel>On a phone</SectionLabel>
              <div className="flex max-w-[380px] flex-col gap-1 rounded-2xl border border-raised bg-ground px-4 py-3">
                <span className="mono text-[10px] uppercase tracking-[0.1em] text-muted">Heurekka · now</span>
                <span className="text-sm font-semibold">{space ? `${space.name}: ${title || "Title"}` : title || "Title"}</span>
                <span className="line-clamp-3 text-[13px] leading-snug text-soft">{body || "Message"}</span>
              </div>
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-raised pt-3.5">
            <span className="flex-[1_1_220px] text-[13px] leading-normal text-muted">
              {reach == null ? "" : `Reaches ${fmt(reach)} ${reach === 1 ? "person" : "people"} in the app inbox. `}
              {push === false ? "Push is off until OneSignal is set up." : push ? "Also pushed to phones that allow announcements." : ""}
            </span>
            {canSend ? (
              <Button kind="primary" onClick={send}>
                Send now
              </Button>
            ) : (
              <span className="text-[13px] text-muted">Only admins can send.</span>
            )}
          </div>
        </div>
        <div className="flex max-w-[420px] min-w-0 flex-[1_1_300px] flex-col gap-2">
          <SectionLabel>Sent</SectionLabel>
          {sent.error ? (
            <LoadError error={sent.error} onRetry={sent.reload} />
          ) : !sent.data ? (
            <Loading rows={2} />
          ) : (
            <>
              {sent.data.items.map((m) => (
                <div key={m.id} className="flex flex-col gap-[5px] rounded-xl border border-raised bg-card px-3.5 py-[13px]">
                  <span className="text-sm font-semibold leading-snug">{m.title}</span>
                  <span className="line-clamp-2 text-[13px] text-soft">{m.body}</span>
                  <span className="text-xs text-muted">
                    {m.audience} · by {m.by} · {ago(m.createdAt)}
                  </span>
                  <span className="mono text-xs text-soft">
                    {fmt(m.recipients)} {m.recipients === 1 ? "person" : "people"}
                  </span>
                </div>
              ))}
              {!sent.data.items.length && <span className="rounded-xl border border-dashed border-line px-5 py-7 text-center text-[13px] text-muted">Nothing sent yet.</span>}
            </>
          )}
        </div>
      </div>
    </>
  );
}
