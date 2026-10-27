"use client";

import Link from "next/link";
import { useState, type ChangeEvent } from "react";

import { useToast } from "@/components/toast";
import { cx, fmt, Button } from "@/components/ui";
import { CREATOR_SHARE, MAX_COLLABORATORS, ME, REVIEWS, itemById, type Split } from "@/lib/studio-data";
import { StatusPill, StudioHeader } from "../../studio-shell";
import { useStudio } from "../../studio-store";

export type ItemTab = "stats" | "versions" | "splits" | "listing";

export function ItemDetail({ id, initialTab }: { id: string; initialTab: ItemTab }) {
  const item = itemById(id)!;
  const isKit = item.cat === "Tool Kit";
  const tabs: [ItemTab, string][] = [["stats", "Stats"], ...(isKit ? [["versions", "Versions"] as [ItemTab, string]] : []), ["splits", "Collaborators"], ["listing", "Listing"]];
  const [tab, setTab] = useState<ItemTab>(tabs.some(([t]) => t === initialTab) ? initialTab : "stats");

  return (
    <>
      <StudioHeader title={item.name} sub={`${item.cat} · ✦ ${item.price} · ${item.status}`} back="/studio/items" />
      <div className="flex gap-1.5 overflow-x-auto border-b border-line">
        {tabs.map(([t, label]) => (
          <button key={t} type="button" onClick={() => setTab(t)} className={cx("min-h-11 border-b-2 px-3.5 text-sm font-semibold whitespace-nowrap", tab === t ? "border-orange text-ink" : "border-transparent text-muted hover:text-ink")}>
            {label}
          </button>
        ))}
      </div>
      {tab === "stats" && <StatsTab id={id} />}
      {tab === "versions" && isKit && <VersionsTab />}
      {tab === "splits" && <SplitsTab id={id} />}
      {tab === "listing" && <ListingTab id={id} />}
    </>
  );
}

function StatsTab({ id }: { id: string }) {
  const item = itemById(id)!;
  const kpis: [string, string][] = [
    ["Views", fmt(item.views)],
    ...(item.tryons
      ? ([
          ["Try-ons", fmt(item.tryons)],
          ["Try-on to buy", ((item.sales / item.tryons) * 100).toFixed(1) + "%"],
        ] as [string, string][])
      : []),
    ["Sales", fmt(item.sales)],
    ["Earned", "✦ " + fmt(Math.round(item.sales * item.price * CREATOR_SHARE))],
    ["Refunds", String(item.refunds)],
    ["Rating", item.rating],
  ];
  const reviews = REVIEWS[id] ?? [];
  return (
    <>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-2.5">
        {kpis.map(([label, value]) => (
          <div key={label} className="flex flex-col gap-1 rounded-[14px] border border-line p-3.5">
            <span className="mono text-xl font-medium">{value}</span>
            <span className="text-xs text-muted">{label}</span>
          </div>
        ))}
      </div>
      <div className="flex max-w-[760px] flex-col gap-2.5">
        <span className="text-[15px] font-semibold">Recent reviews</span>
        {reviews.length === 0 && <span className="text-sm text-muted">No reviews yet. They show up here once people buy it.</span>}
        {reviews.map((r) => (
          <div key={r.who} className="flex items-start gap-3.5 rounded-[14px] bg-card px-4 py-3.5">
            <div className="flex flex-1 flex-col gap-1.5">
              <div className="flex gap-2.5 text-[13px]">
                <span className="font-semibold">{r.who}</span>
                <span className="text-gold-ink" aria-label={`${r.stars} out of 5`}>
                  {"★".repeat(r.stars) + "☆".repeat(5 - r.stars)}
                </span>
                <span className="text-muted">{r.when}</span>
              </div>
              <span className="text-sm leading-[1.55]">{r.text}</span>
            </div>
            {r.shot && <span className="h-20 w-11 shrink-0 rounded-lg border border-line" style={{ background: r.shot }} aria-label="Screenshot from the buyer" />}
          </div>
        ))}
      </div>
      {item.cat === "Theme" && (
        <Link href="/studio/themes/editor?from=lagos" className="tap inline-flex min-h-11 items-center self-start rounded-full border border-line px-[18px] text-sm font-semibold hover:border-muted">
          Open in theme editor
        </Link>
      )}
    </>
  );
}

const semver = (v: string) => v.split(".").map(Number);
const isHigher = (a: number[], b: number[]) => a[0] > b[0] || (a[0] === b[0] && (a[1] > b[1] || (a[1] === b[1] && a[2] > b[2])));

type NewFile = { name: string; size: string; scan: "Scanning…" | "Clean" };

function VersionsTab() {
  const st = useStudio();
  const toast = useToast();
  const [ver, setVer] = useState("");
  const [notes, setNotes] = useState("");
  const [files, setFiles] = useState<NewFile[]>([]);
  const [err, setErr] = useState("");

  const current = st.versions[0].v;
  const ok = /^\d+\.\d+\.\d+$/.test(ver);
  const higher = ok && isHigher(semver(ver), semver(current));
  const bad = !!ver && !higher;
  const help = !ver
    ? `Current is ${current}. Use 1.2.1 for fixes, 1.3.0 for additions, 2.0.0 for big changes.`
    : !ok
      ? "Use three numbers, like 1.3.0."
      : !higher
        ? `Has to be higher than ${current}.`
        : semver(ver)[0] > semver(current)[0]
          ? "Major version. Every buyer gets a notification."
          : "Buyers see an Update button.";

  const addFiles = (e: ChangeEvent<HTMLInputElement>) => {
    const fs = [...(e.target.files ?? [])].map((f) => ({ name: f.name, size: (f.size / 1e6).toFixed(1) + " MB", scan: "Scanning…" as const }));
    e.target.value = "";
    setFiles((cur) => cur.concat(fs));
    // Simulated malware scan.
    setTimeout(() => setFiles((cur) => cur.map((f) => ({ ...f, scan: "Clean" }))), 1400);
  };

  const submit = () => {
    if (!higher) return setErr("Fix the version number first.");
    if (notes.trim().length < 20) return setErr("Say what changed in at least 20 characters, so buyers know whether to update.");
    if (!files.length) return setErr("Add the files for this version.");
    if (files.some((f) => f.scan !== "Clean")) return setErr("Wait for the file scan to finish.");
    st.set((s) => ({ versions: [{ v: ver, date: "Today", status: "In review", notes: notes.trim(), files: files.map((f) => `${f.name} · ${f.size}`).join(", ") }, ...s.versions] }));
    toast(`v${ver} sent for review. ${current} stays live until it's approved.`);
    setVer("");
    setNotes("");
    setFiles([]);
    setErr("");
  };

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,340px),1fr))] items-start gap-4">
      <div className="flex flex-col gap-2.5">
        <span className="text-[15px] font-semibold">Versions</span>
        {st.versions.map((v) => (
          <div key={v.v} className="flex flex-col gap-1.5 rounded-[14px] border border-line bg-card px-4 py-3.5">
            <div className="flex items-center gap-2.5">
              <span className="mono text-[15px] font-medium">v{v.v}</span>
              <StatusPill status={v.status} />
              <span className="ml-auto text-xs text-muted">{v.date}</span>
            </div>
            <span className="text-sm leading-[1.55] whitespace-pre-line">{v.notes}</span>
            <span className="text-xs text-muted">{v.files}</span>
          </div>
        ))}
        <span className="text-xs leading-normal text-muted">Buyers get every update free and can download any older version. Major versions (2.0.0) notify every buyer.</span>
      </div>
      <div className="flex flex-col gap-3.5 rounded-2xl border border-line p-[18px]">
        <span className="text-[15px] font-semibold">Upload a new version</span>
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
          Version number
          <input value={ver} onChange={(e) => setVer(e.target.value.trim())} placeholder="1.3.0" className={cx("mono h-11 rounded-[10px] border bg-ground px-3.5 text-[15px] text-ink", bad ? "border-err" : "border-line")} />
          <span className={cx("text-xs font-normal", bad ? "text-err" : "text-muted")}>{help}</span>
        </label>
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
          What changed
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} placeholder="One change per line. Buyers see this before they update." className="resize-y rounded-[10px] border border-line bg-ground px-3.5 py-3 text-sm leading-normal font-normal text-ink" />
        </label>
        <div className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold">Files</span>
          {files.map((f, i) => (
            <div key={f.name + i} className="flex min-h-11 items-center gap-2.5 rounded-[10px] bg-raised px-3 text-[13px]">
              <span className="mono flex-1 truncate">{f.name}</span>
              <span className="text-muted">{f.size}</span>
              <span className={f.scan === "Clean" ? "text-ok" : "text-muted"}>{f.scan}</span>
            </div>
          ))}
          <label className="tap flex min-h-11 cursor-pointer items-center justify-center rounded-[10px] border border-dashed border-line text-[13px] font-semibold hover:border-muted">
            + Add files
            <input type="file" multiple onChange={addFiles} className="hidden" />
          </label>
          <span className="text-xs text-muted">ZIP, FIG, PDF or source files, up to 200 MB in total. Every file is scanned before review.</span>
        </div>
        {err && <span className="text-xs text-err">{err}</span>}
        <Button kind="primary" className="self-start px-[18px]" onClick={submit}>
          Send for review
        </Button>
      </div>
    </div>
  );
}

function SplitsTab({ id }: { id: string }) {
  const st = useStudio();
  const toast = useToast();
  const [invite, setInvite] = useState("");
  const rows = st.splits[id] ?? [ME];
  const total = rows.reduce((a, r) => a + (+r.pct || 0), 0);
  const setRows = (next: Split[]) => st.set((s) => ({ splits: { ...s.splits, [id]: next } }));

  const add = () => {
    const h = invite.trim().replace(/^@/, "");
    if (h.length < 3) return toast("Enter their @username.");
    if (rows.length >= MAX_COLLABORATORS) return toast(`Up to ${MAX_COLLABORATORS} people per item.`);
    const name = h
      .split(/[._]/)
      .filter(Boolean)
      .map((w) => w[0].toUpperCase() + w.slice(1))
      .join(" ");
    const ini = name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2);
    setRows([...rows, { name, ini, pct: "0", status: "Invite sent" }]);
    setInvite("");
  };

  const save = () => {
    if (total !== 100) return toast(`Shares add up to ${total}%. They need to make 100%.`);
    setRows(rows.map((r, i) => (i && r.status !== "Invite sent" ? { ...r, status: "Waiting to accept the change" } : r)));
    toast("Sent. The new split starts once everyone accepts.");
  };

  return (
    <div className="flex max-w-[640px] flex-col gap-3">
      <span className="text-sm leading-[1.55] text-muted">Split what this item earns. Shares must add up to 100%. Everyone has to accept before a change applies, and changes only affect new sales.</span>
      {rows.map((r, i) => (
        <div key={`${i}-${r.name}`} className="flex min-h-[60px] items-center gap-3 rounded-[14px] border border-line bg-card px-3.5 py-2">
          <span className={cx("flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white", i ? "bg-[#3A4F63]" : "bg-navy")}>{r.ini}</span>
          <div className="flex flex-1 flex-col">
            <span className="text-sm font-semibold">{r.name}</span>
            <span className={cx("text-xs", r.status === "Invite sent" ? "text-lift" : "text-muted")}>{r.status}</span>
          </div>
          <input
            value={r.pct}
            inputMode="numeric"
            aria-label={`${r.name} share`}
            onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, pct: e.target.value.replace(/\D/g, "").slice(0, 3) } : x)))}
            className="mono h-10 w-16 rounded-lg border border-line bg-ground px-2.5 text-right text-sm text-ink"
          />
          <span className="text-sm text-muted">%</span>
          {i > 0 ? (
            <button type="button" aria-label={`Remove ${r.name}`} onClick={() => setRows(rows.filter((_, j) => j !== i))} className="tap flex h-9 w-9 items-center justify-center rounded-full text-muted hover:text-ink">
              ✕
            </button>
          ) : (
            <span className="w-9" />
          )}
        </div>
      ))}
      <div className="flex flex-wrap gap-2">
        <input value={invite} onChange={(e) => setInvite(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} placeholder="@username" className="h-11 flex-[1_1_200px] rounded-full border border-line bg-ground px-3.5 text-sm text-ink" />
        <Button className="px-[18px]" onClick={add}>
          Invite
        </Button>
      </div>
      <div className={cx("flex justify-between gap-2.5 rounded-xl px-3.5 py-3 text-sm", total === 100 ? "bg-okbg" : "bg-errbg")}>
        <span>Total</span>
        <span className={cx("mono", total === 100 ? "text-ok" : "text-err")}>{total}%</span>
      </div>
      <Button kind={total === 100 ? "primary" : "neutral"} className={cx("self-start px-[18px]", total !== 100 && "border-raised bg-raised text-muted")} onClick={save}>
        Send for approval
      </Button>
      <span className="text-xs leading-normal text-muted">Each person&apos;s share clears on the same 14-day hold and goes to their own wallet. Collaborators need a Heurekka account in good standing.</span>
    </div>
  );
}

function ListingTab({ id }: { id: string }) {
  const item = itemById(id)!;
  const rows: [string, string][] = [
    ["Price", "✦ " + item.price],
    ["You keep", `✦ ${Math.round(item.price * CREATOR_SHARE)} per sale (80%)`],
    ["Category", item.cat],
    ["Status", item.status],
    ["Remixes", item.cat === "Theme" ? "Allowed · 6 remixes · ✦ 96 earned from them" : "Not available for this type"],
  ];
  return (
    <div className="flex max-w-[640px] flex-col gap-3">
      {rows.map(([k, v]) => (
        <div key={k} className="flex justify-between gap-4 border-b border-raised py-3 text-sm">
          <span className="text-muted">{k}</span>
          <span className="text-right">{v}</span>
        </div>
      ))}
      <span className="text-[13px] leading-[1.55] text-muted">Price changes apply to new buyers only. Edits to files or the description go through review, and the current version stays live until they&apos;re approved.</span>
    </div>
  );
}
