"use client";

import { useState } from "react";

import { useConfirm } from "@/components/modal";
import { useToast } from "@/components/toast";
import { Badge, Button, Card, Chip, cx, Field, TextArea } from "@/components/ui";
import { PageHeader } from "../admin-shell";
import { useAdmin } from "../admin-store";
import { adminGet, adminPost, ago, useAdminData, type AdminApiError, type ShopCaseRow, type ShopItemRow } from "../admin-api";
import { LoadError, Loading } from "../data-state";

const STATUS: Record<ShopItemRow["status"], { label: string; tone: "gold" | "green" | "grey" | "red" | "orange" }> = {
  draft: { label: "Draft", tone: "grey" },
  in_review: { label: "In review", tone: "gold" },
  rejected: { label: "Changes needed", tone: "orange" },
  listed: { label: "On sale", tone: "green" },
  unlisted: { label: "Unlisted", tone: "grey" },
  removed: { label: "Taken down", tone: "red" },
};

const kindLabel = (k: ShopItemRow["kind"]) => (k === "memoji" ? "Memoji Pack" : "Tool Kit");
const size = (b: number) => (b >= 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.ceil(b / 1024)} KB`);

/**
 * The Shop: creators' first items wait here for review (48-hour target),
 * everything on sale can be taken down, and finance staff settle refund
 * reports that need a person.
 */
export default function ShopPage() {
  const a = useAdmin();
  const finance = a.me?.staffRole === "finance" || a.me?.staffRole === "admin";
  const mod = a.me?.staffRole === "moderator" || a.me?.staffRole === "admin";
  const tabs = [...(mod ? (["queue", "items"] as const) : []), ...(finance ? (["cases"] as const) : [])];
  const [tab, setTab] = useState<(typeof tabs)[number]>(tabs[0] ?? "cases");

  return (
    <>
      <PageHeader title="Shop" sub="Review creators' first items, take things down, and settle refunds." />
      <div className="mb-3 flex flex-wrap gap-1.5">
        {tabs.map((t) => (
          <Chip key={t} on={tab === t} onClick={() => setTab(t)}>
            {t === "queue" ? "Waiting for review" : t === "items" ? "All items" : "Refund reports"}
          </Chip>
        ))}
      </div>
      {tab === "queue" ? <Queue /> : tab === "items" ? <Items /> : <Cases />}
    </>
  );
}

function Assets({ item }: { item: ShopItemRow }) {
  const toast = useToast();
  if (item.kind === "memoji")
    return (
      <div className="flex flex-wrap gap-2">
        {(item.stickers ?? item.preview).map((s) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={s.id} src={s.url} alt="" className="h-20 w-20 rounded-xl border border-line bg-raised object-contain p-1.5" />
        ))}
      </div>
    );
  return (
    <div className="flex flex-col gap-1.5">
      {(item.files ?? []).map((f) => (
        <button
          key={f.id}
          className="flex items-center justify-between rounded-xl border border-line px-3 py-2 text-left text-sm hover:border-orange"
          onClick={async () => {
            try {
              const { url } = await adminGet<{ url: string }>(`shop/files/${f.id}`);
              window.open(url, "_blank", "noopener");
            } catch (e) {
              toast((e as AdminApiError).message);
            }
          }}
        >
          <span className="truncate">{f.name}</span>
          <span className="mono shrink-0 pl-3 text-xs text-muted">{size(f.bytes)} ↓</span>
        </button>
      ))}
    </div>
  );
}

function Queue() {
  const q = useAdminData<ShopItemRow[]>("shop/queue");
  const toast = useToast();
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const decide = async (i: ShopItemRow, decision: "approve" | "reject") => {
    setBusy(`${i.id}:${decision}`);
    try {
      await adminPost(`shop/items/${i.id}/${decision}`, { note: notes[i.id] ?? "" });
      toast(decision === "approve" ? `${i.name} is on sale. ${i.creator.displayName} has been told.` : `Sent back to ${i.creator.displayName}.`);
      q.reload();
    } catch (e) {
      toast((e as AdminApiError).message);
    } finally {
      setBusy(null);
    }
  };

  if (q.error) return <LoadError error={q.error} onRetry={q.reload} />;
  if (!q.data) return <Loading rows={3} />;
  if (!q.data.length) return <Card className="max-w-[520px] rounded-2xl p-6 text-sm text-muted">Nothing waiting. Creators&apos; first items show up here.</Card>;
  return (
    <div className="flex max-w-[900px] flex-col gap-3">
      {q.data.map((i) => (
        <Card key={i.id} className="flex flex-col gap-3 rounded-2xl p-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="gold">{kindLabel(i.kind)}</Badge>
            {i.canResubmit === false && i.staffNote && <Badge tone="orange">Resubmitted</Badge>}
            <span className="text-xs text-muted">
              by {i.creator.displayName} · ✦ {i.price} · waiting {i.submittedAt ? ago(i.submittedAt).replace(" ago", "") : ""}
            </span>
          </div>
          <div>
            <div className="text-[17px] font-bold">{i.name}</div>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-soft">{i.description}</p>
          </div>
          {i.staffNote && <span className="text-xs text-muted">Last time: “{i.staffNote}”</span>}
          <Assets item={i} />
          <Field label="Note to the creator" hint="Needed to send it back. Say exactly what to change.">
            <TextArea rows={2} value={notes[i.id] ?? ""} onChange={(e) => setNotes((n) => ({ ...n, [i.id]: e.target.value }))} placeholder="Two stickers are blurry at small sizes." />
          </Field>
          <div className="flex gap-2">
            <Button kind="primary" size="sm" loading={busy === `${i.id}:approve`} disabled={!!busy} onClick={() => decide(i, "approve")}>
              Approve and list
            </Button>
            <Button size="sm" loading={busy === `${i.id}:reject`} disabled={!!busy || (notes[i.id] ?? "").trim().length < 5} onClick={() => decide(i, "reject")}>
              Send back
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}

function Items() {
  const [status, setStatus] = useState<"" | ShopItemRow["status"]>("listed");
  const list = useAdminData<ShopItemRow[]>(`shop/items${status ? `?status=${status}` : ""}`);
  const ask = useConfirm();
  const toast = useToast();
  const [note, setNote] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const remove = async (i: ShopItemRow) => {
    if (!(await ask({ title: `Take down ${i.name}?`, body: "It leaves the Shop and stops working for its owners. The creator is told why and can appeal.", confirm: "Take down", danger: true }))) return;
    try {
      await adminPost(`shop/items/${i.id}/remove`, { note: note.trim() });
      toast("Taken down.");
      setNote("");
      list.reload();
    } catch (e) {
      toast((e as AdminApiError).message);
    }
  };

  return (
    <div className="flex max-w-[900px] flex-col gap-3">
      <div className="flex flex-wrap gap-1.5">
        {(["listed", "unlisted", "rejected", "removed", ""] as const).map((s) => (
          <Chip key={s} on={status === s} onClick={() => setStatus(s)}>
            {s ? STATUS[s].label : "All"}
          </Chip>
        ))}
      </div>
      {list.error ? (
        <LoadError error={list.error} onRetry={list.reload} />
      ) : !list.data ? (
        <Loading rows={4} />
      ) : !list.data.length ? (
        <Card className="rounded-2xl p-6 text-sm text-muted">Nothing here.</Card>
      ) : (
        list.data.map((i) => (
          <Card key={i.id} className={cx("flex flex-col gap-3 rounded-2xl p-4", openId === i.id && "border-orange")}>
            <button className="flex flex-wrap items-center gap-2 text-left" onClick={() => setOpenId(openId === i.id ? null : i.id)}>
              <Badge tone={STATUS[i.status].tone}>{STATUS[i.status].label}</Badge>
              <span className="font-semibold">{i.name}</span>
              <span className="text-xs text-muted">
                {kindLabel(i.kind)} by {i.creator.displayName} · ✦ {i.price} · {i.sales} sold
              </span>
            </button>
            {openId === i.id && (
              <>
                <p className="text-sm text-soft">{i.description}</p>
                {i.staffNote && <span className="text-xs text-muted">Staff note: “{i.staffNote}”</span>}
                <Assets item={i} />
                {i.status !== "removed" && (
                  <div className="flex flex-col gap-2 border-t border-raised pt-3">
                    <Field label="Why take it down" hint="Shown to the creator. Logged in the audit log.">
                      <TextArea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Stickers copied from another creator's pack." />
                    </Field>
                    <Button kind="danger" size="sm" className="self-start" disabled={note.trim().length < 5} onClick={() => remove(i)}>
                      Take down
                    </Button>
                  </div>
                )}
              </>
            )}
          </Card>
        ))
      )}
    </div>
  );
}

function Cases() {
  const list = useAdminData<ShopCaseRow[]>("shop/cases");
  const toast = useToast();
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const refund = async (c: ShopCaseRow) => {
    setBusy(c.id);
    try {
      await adminPost(`shop/cases/${c.id}/refund`, { note: (notes[c.id] ?? "").trim() });
      toast(`Refunded ✦ ${c.price} to ${c.buyer.displayName}. The creator's share was taken back.`);
      list.reload();
    } catch (e) {
      toast((e as AdminApiError).message);
    } finally {
      setBusy(null);
    }
  };

  if (list.error) return <LoadError error={list.error} onRetry={list.reload} />;
  if (!list.data) return <Loading rows={3} />;
  if (!list.data.length) return <Card className="max-w-[520px] rounded-2xl p-6 text-sm text-muted">No refund reports yet.</Card>;
  return (
    <div className="flex max-w-[900px] flex-col gap-3">
      {list.data.map((c) => (
        <Card key={c.id} className="flex flex-col gap-2.5 rounded-2xl p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={c.status === "open" ? "gold" : c.status === "fixed" ? "green" : "grey"}>{c.status === "open" ? "Waiting for the creator" : c.status === "fixed" ? "Creator fixed it" : "Refunded"}</Badge>
            <span className="font-semibold">{c.item.name}</span>
            <span className="text-xs text-muted">
              {c.buyer.displayName} paid ✦ {c.price} · reported {ago(c.createdAt)}
              {c.status === "open" ? ` · auto-refund ${new Date(c.fixBy).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}` : ""}
            </span>
          </div>
          <div className="text-sm">“{c.note}”</div>
          {c.fixNote && <div className="text-sm text-muted">Creator: “{c.fixNote}”</div>}
          {c.staffNote && <div className="text-xs text-muted">Staff: “{c.staffNote}”</div>}
          {c.status !== "refunded" && (
            <div className="flex flex-wrap items-end gap-2 border-t border-raised pt-3">
              <div className="min-w-[260px] flex-1">
                <Field label="Refund now" hint="Takes the creator's share back. Shown to both of them.">
                  <TextArea rows={1} value={notes[c.id] ?? ""} onChange={(e) => setNotes((n) => ({ ...n, [c.id]: e.target.value }))} placeholder="Confirmed: the files are empty." />
                </Field>
              </div>
              <Button kind="danger" size="sm" loading={busy === c.id} disabled={!!busy || (notes[c.id] ?? "").trim().length < 5} onClick={() => refund(c)}>
                Refund ✦ {c.price}
              </Button>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
