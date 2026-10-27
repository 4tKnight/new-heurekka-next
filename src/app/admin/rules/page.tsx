"use client";

import { useState } from "react";

import { useConfirm } from "@/components/modal";
import { useToast } from "@/components/toast";
import { Button, Field, Stepper, TextArea, Toggle } from "@/components/ui";
import { PageHeader } from "../admin-shell";
import { useAdmin } from "../admin-store";
import { adminPatch, useAdminData, type AdminApiError, type AutoRules } from "../admin-api";
import { LoadError, Loading, PrototypeNote } from "../data-state";

type NumKey = "newAccountLinks" | "newAccountDms" | "threadsPerHour" | "autoHide";
const NUMERIC: { key: NumKey; field: "days" | "limit" | "reports"; label: string; note: string; unit: string; min: number; max: number }[] = [
  { key: "newAccountLinks", field: "days", label: "No links from new accounts", note: "Accounts younger than this can't post links in threads, replies or messages.", unit: "days", min: 1, max: 60 },
  { key: "newAccountDms", field: "days", label: "No DMs to strangers from new accounts", note: "Only friends can be messaged during this window.", unit: "days", min: 1, max: 60 },
  { key: "threadsPerHour", field: "limit", label: "Thread posting limit", note: "Per member, per hour.", unit: "/ hour", min: 1, max: 100 },
  { key: "autoHide", field: "reports", label: "Hold a post after reports", note: "Hidden from everyone but its author until staff review it. Reports from members 30+ days old with a clean record count double.", unit: "reports", min: 2, max: 50 },
];

/** The automatic moderation layer. Changes reach the apps within a minute, with no release. */
export default function RulesPage() {
  const a = useAdmin();
  const ask = useConfirm();
  const toast = useToast();
  const rules = useAdminData<AutoRules>("rules");
  const [words, setWords] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const isAdmin = a.me?.staffRole === "admin";

  const save = async (patch: Partial<AutoRules>, msg = "Saved. The apps pick it up within a minute.") => {
    try {
      await adminPatch("rules", patch);
      rules.reload();
      toast(msg);
    } catch (e) {
      toast((e as AdminApiError).message);
    }
  };

  if (rules.error) return <LoadError error={rules.error} onRetry={rules.reload} />;
  const r = rules.data;
  return (
    <>
      <PageHeader title="Rules" sub="Settings for the automatic moderation layer. Every change is logged." />
      {!r ? (
        <Loading rows={4} />
      ) : (
        <div className="flex max-w-[760px] flex-col gap-2">
          {NUMERIC.map((x) => {
            const v = r[x.key] as unknown as { on: boolean; [k: string]: number | boolean };
            const n = v[x.field] as number;
            return (
              <div key={x.key} className="flex flex-wrap items-center gap-3.5 rounded-xl border border-line bg-card px-4 py-3.5">
                <Toggle
                  on={v.on}
                  label={x.label}
                  onChange={async () => {
                    if (!isAdmin) return toast("Only admins can change rules.");
                    if (v.on && !(await ask({ title: `Turn off "${x.label}"?`, body: "The apps stop enforcing this rule within a minute.", confirm: "Turn off", danger: true }))) return;
                    await save({ [x.key]: { ...v, on: !v.on } } as Partial<AutoRules>);
                  }}
                />
                <div className="flex flex-[1_1_260px] flex-col gap-0.5">
                  <span className="text-sm font-semibold">{x.label}</span>
                  <span className="text-xs text-muted">{x.note}</span>
                </div>
                <Stepper
                  disabled={!v.on || !isAdmin}
                  minWidth={64}
                  value={n}
                  unit={x.unit}
                  onDec={() => n > x.min && save({ [x.key]: { ...v, [x.field]: n - 1 } } as Partial<AutoRules>)}
                  onInc={() => n < x.max && save({ [x.key]: { ...v, [x.field]: n + 1 } } as Partial<AutoRules>)}
                />
              </div>
            );
          })}
          <div className="flex flex-col gap-3 rounded-xl border border-line bg-card px-4 py-3.5">
            <div className="flex flex-wrap items-center gap-3.5">
              <Toggle on={r.words.on} label="Word filter" onChange={() => (isAdmin ? save({ words: { ...r.words, on: !r.words.on } }) : toast("Only admins can change rules."))} />
              <div className="flex flex-[1_1_260px] flex-col gap-0.5">
                <span className="text-sm font-semibold">Word filter</span>
                <span className="text-xs text-muted">Posts, replies and messages containing these words (whole words, any case) can&apos;t be sent. One per line.</span>
              </div>
            </div>
            <Field label={`${r.words.list.length} ${r.words.list.length === 1 ? "word" : "words"}`} error={err || undefined}>
              <TextArea rows={5} disabled={!isAdmin} value={words ?? r.words.list.join("\n")} onChange={(e) => setWords(e.target.value)} placeholder={"one word\nper line"} />
            </Field>
            {isAdmin && words !== null && (
              <div className="flex justify-end">
                <Button
                  kind="primary"
                  onClick={async () => {
                    setErr("");
                    const list = [...new Set(words.split("\n").map((w) => w.trim().toLowerCase()).filter((w) => w.length >= 2))];
                    if (list.some((w) => w.length > 40)) return setErr("Keep each word to 40 characters.");
                    await save({ words: { ...r.words, list } });
                    setWords(null);
                  }}
                >
                  Save words
                </Button>
              </div>
            )}
          </div>
          <span className="text-xs text-muted">{isAdmin ? "Changes apply to the apps within a minute. No release needed." : "Only admins can change these."}</span>
          <div className="mt-4 flex flex-col gap-2">
            <PrototypeNote>Arrive with the Shop and payouts</PrototypeNote>
            <span className="text-[13px] text-muted">Pre-reviewing new creators&apos; packs and holding risky cash-outs are set here once those stages ship.</span>
          </div>
        </div>
      )}
    </>
  );
}
