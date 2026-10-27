"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Room, RoomEvent, Track, type RemoteTrack } from "livekit-client";

import { useConfirm } from "@/components/modal";
import { useToast } from "@/components/toast";
import { Badge, Button, cx, Field, TextArea } from "@/components/ui";
import { PageHeader } from "../admin-shell";
import { adminPost, ago, useAdminData, type AdminApiError, type Person } from "../admin-api";
import { LoadError, Loading } from "../data-state";

type LiveRow = { id: string; title: string; where: string; host: Person; startedAt: string | null; count: number; peak: number; hostReports24h: number };

/**
 * Buzz sessions running now, most-reported hosts first. Moderators can listen
 * in silently (nobody in the room sees them), warn the host, end the session,
 * or stop the host going live again.
 */
export default function LivePage() {
  const list = useAdminData<LiveRow[]>("buzz/live");
  const [openId, setOpenId] = useState<string | null>(null);
  // Refresh every 15 seconds: sessions start and end all the time.
  const { reload } = list;
  useEffect(() => {
    const t = setInterval(reload, 15_000);
    return () => clearInterval(t);
  }, [reload]);
  const rows = [...(list.data ?? [])].sort((a, b) => b.hostReports24h - a.hostReports24h);
  const sel = rows.find((r) => r.id === openId) ?? rows[0];

  return (
    <>
      <PageHeader title="Live Buzz" sub="Sessions running now. Hosts with recent reports first." />
      {list.error ? (
        <LoadError error={list.error} onRetry={list.reload} />
      ) : !list.data ? (
        <Loading rows={2} />
      ) : !rows.length ? (
        <div className="flex max-w-[1180px] flex-col gap-1.5 rounded-xl border border-dashed border-line px-5 py-7 text-center">
          <span className="text-[15px] font-semibold">Nothing live</span>
          <span className="text-[13px] text-muted">Buzz sessions show here while they run.</span>
        </div>
      ) : (
        <div className="flex max-w-[1180px] flex-wrap items-start gap-[18px]">
          <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-2">
            {rows.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setOpenId(r.id)}
                className={cx("flex flex-col gap-1.5 rounded-xl border px-3.5 py-3 text-left", sel?.id === r.id ? "border-orange bg-card" : "border-line bg-card hover:border-soft")}
              >
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-orange" />
                  <span className="text-xs text-muted">Audio · {r.count} in the room</span>
                  {r.hostReports24h > 0 && <Badge tone="red">{r.hostReports24h} reports today</Badge>}
                  <span className="mono ml-auto text-[11px] text-muted">{r.startedAt ? ago(r.startedAt) : ""}</span>
                </div>
                <span className="text-sm font-semibold">{r.title}</span>
                <span className="text-xs text-muted">
                  {r.host.name} · {r.where}
                </span>
              </button>
            ))}
          </div>
          {sel && <Detail key={sel.id} r={sel} onDone={() => list.reload()} />}
        </div>
      )}
    </>
  );
}

function Detail({ r, onDone }: { r: LiveRow; onDone: () => void }) {
  const router = useRouter();
  const ask = useConfirm();
  const toast = useToast();
  const [listening, setListening] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const room = useRef<Room | null>(null);
  const audio = useRef<HTMLDivElement>(null);

  // Leave the room when switching sessions or closing the page.
  useEffect(() => () => void room.current?.disconnect(), []);

  const listen = async () => {
    if (listening) {
      await room.current?.disconnect();
      room.current = null;
      setListening(false);
      return;
    }
    setBusy(true);
    try {
      const { url, token } = await adminPost<{ url: string; token: string }>(`buzz/${r.id}/listen`, {});
      const rm = new Room();
      rm.on(RoomEvent.TrackSubscribed, (track: RemoteTrack) => {
        if (track.kind === Track.Kind.Audio) audio.current?.appendChild(track.attach());
      });
      rm.on(RoomEvent.Disconnected, () => setListening(false));
      await rm.connect(url, token);
      await rm.startAudio();
      room.current = rm;
      setListening(true);
    } catch (e) {
      toast((e as AdminApiError).message ?? "Couldn't connect to the session.");
    } finally {
      setBusy(false);
    }
  };

  const warn = async () => {
    if (note.trim().length < 5) return toast("Write the warning: the host sees it.");
    try {
      await adminPost(`users/${r.host.id}/action`, { kind: "warn", rule: "harassment", note: note.trim() });
      toast(`${r.host.name} has been warned.`);
      setNote("");
    } catch (e) {
      toast((e as AdminApiError).message);
    }
  };

  const end = async () => {
    if (!(await ask({ title: "End this Buzz for everyone?", body: "Everyone is disconnected and the host is told. Logged in the audit log.", confirm: "End session", danger: true }))) return;
    try {
      await room.current?.disconnect();
      await adminPost(`buzz/${r.id}/end`, {});
      toast("Session ended.");
      onDone();
    } catch (e) {
      toast((e as AdminApiError).message);
    }
  };

  const block = async () => {
    if (!(await ask({ title: `Stop ${r.host.name} going live?`, body: "Their live session ends now and they can't host another until this is lifted from their user page.", confirm: "Stop going live", danger: true }))) return;
    try {
      await adminPost(`users/${r.host.id}/live-block`, { on: true });
      toast(`${r.host.name} can't host Buzz now.`);
      onDone();
    } catch (e) {
      toast((e as AdminApiError).message);
    }
  };

  return (
    <div className="rise flex min-w-0 flex-[2_1_420px] flex-col gap-4 rounded-2xl border border-line bg-card p-[22px]">
      <div className="flex flex-col gap-1">
        <span className="text-[17px] font-bold">{r.title}</span>
        <span className="text-[13px] text-muted">
          {r.where} · started {r.startedAt ? ago(r.startedAt) : "just now"} · {r.count} now, {r.peak} at most
        </span>
      </div>
      <button type="button" onClick={() => router.push(`/admin/users?u=${r.host.id}`)} className="flex items-center gap-2 rounded-xl border border-raised px-3.5 py-2.5 text-left hover:border-line">
        <span className="text-sm font-semibold">Host: {r.host.name}</span>
        <span className="text-[13px] text-muted">@{r.host.handle}</span>
        <span className="ml-auto text-xs text-muted">Open ›</span>
      </button>
      <div className="flex flex-wrap items-center gap-2">
        <Button kind={listening ? "neutral" : "primary"} loading={busy} onClick={listen}>
          {listening ? "Stop listening" : "Listen silently"}
        </Button>
        {listening && <span className="text-[13px] text-muted">You&apos;re hidden: nobody in the room sees you.</span>}
      </div>
      <div ref={audio} className="hidden" />
      <Field label="Warn the host · they see this">
        <TextArea rows={2} value={note} maxLength={500} onChange={(e) => setNote(e.target.value)} placeholder="Keep it civil: personal attacks aren't allowed in Buzz." />
      </Field>
      <div className="flex flex-wrap justify-end gap-2 border-t border-raised pt-3.5">
        <Button onClick={warn}>Send warning</Button>
        <Button kind="danger" onClick={block}>
          Stop them going live
        </Button>
        <Button kind="danger" onClick={end}>
          End session
        </Button>
      </div>
    </div>
  );
}
