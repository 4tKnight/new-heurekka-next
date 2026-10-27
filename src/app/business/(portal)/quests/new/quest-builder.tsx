"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useToast } from "@/components/toast";
import { Button, cx, fmt, naira } from "@/components/ui";
import { MAX_STEPS, QUEST_FEE, SPACES, SPARK_NGN, TASKS, blankDraft, taskById, type Campaign, type Draft } from "@/lib/business-data";
import { useBusiness } from "../../../business-store";
import { PortalHeader, pickClass } from "../../portal-shell";

const STEPS = ["Task", "Audience", "Budget", "Review"];
const inputCls = "rounded-[10px] border bg-card px-3.5 text-[15px] font-normal text-ink";

const fromCampaign = (c: Campaign, copy: boolean): Draft => ({
  ...blankDraft(),
  task: c.task,
  title: copy ? `${c.title} (copy)` : c.title,
  picked: c.spaces,
  reward: c.reward,
  cap: c.cap,
  days: c.days,
  editId: copy ? null : c.id,
});

function Radio({ on, label, help, onPick }: { on: boolean; label: string; help: string; onPick: () => void }) {
  return (
    <button type="button" role="radio" aria-checked={on} onClick={onPick} className={cx("tap flex min-h-[60px] items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left", on ? "border-orange bg-warm" : "border-line hover:border-muted")}>
      <span className={cx("flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2", on ? "border-orange" : "border-line")}>{on && <span className="h-2.5 w-2.5 rounded-full bg-orange" />}</span>
      <span className="flex flex-col gap-0.5">
        <span className="text-sm font-semibold text-ink">{label}</span>
        <span className="text-xs leading-snug text-muted">{help}</span>
      </span>
    </button>
  );
}

export function QuestBuilder({ editId, copyId }: { editId?: string; copyId?: string }) {
  const b = useBusiness();
  const router = useRouter();
  const toast = useToast();
  const [d, setD] = useState<Draft>(() => {
    const src = b.campaigns.find((c) => c.id === (editId ?? copyId));
    return src ? fromCampaign(src, !editId) : blankDraft();
  });
  const [step, setStep] = useState(1);
  const [tried, setTried] = useState(false);
  const up = (p: Partial<Draft>) => setD((cur) => ({ ...cur, ...p }));

  const task = taskById(d.task);
  const reach = SPACES.filter(([n]) => d.picked.includes(n)).reduce((a, [, n]) => a + n, 0);
  const rewardsN = d.reward * d.cap * SPARK_NGN;
  const fee = rewardsN * QUEST_FEE;
  const total = rewardsN + fee;
  const titleBad = d.title.trim().length < 8;
  const stepsArr = d.steps
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, MAX_STEPS);
  const canFund = b.pay === "card" || b.balance >= total;
  const defCard = b.cards.find((c) => c.def) ?? b.cards[0];
  const launchStatus = b.verified ? "In review" : "Waiting for verification";

  const goStep = (n: number) => {
    if (n > step) return;
    setTried(false);
    setStep(n);
  };

  const save = (status: Campaign["status"]) => {
    const fields = { title: d.title.trim(), task: d.task, spaces: d.picked, reward: d.reward, cap: d.cap, days: d.days, status, split: d.picked.map(() => 0) };
    b.set((s) => ({
      campaigns: d.editId ? s.campaigns.map((c) => (c.id === d.editId ? { ...c, ...fields } : c)) : [{ id: "n" + Date.now(), done: 0, started: 0, ends: "–", ...fields }, ...s.campaigns],
    }));
    router.push("/business/quests");
  };

  const next = () => {
    if (step === 1 && (titleBad || !stepsArr.length)) {
      setTried(true);
      return toast(titleBad ? "Add a title first." : "Add at least one step.");
    }
    if (step === 2 && !d.picked.length) return setTried(true);
    if (step === 3 && !canFund) return toast("Not enough prepaid balance for this budget.");
    if (step < 4) {
      setTried(false);
      return setStep(step + 1);
    }
    save(launchStatus);
    toast(b.verified ? "Submitted for review. Nothing is held or charged until it's approved, and then only for verified completions." : "Saved. It goes to review as soon as your business is verified.");
  };

  const saveDraft = () => {
    if (d.title.trim().length < 3) return toast("Give it a title before saving.");
    save("Draft");
    toast("Draft saved.");
  };

  const summary: [string, string, number][] = [
    ["Task", task.label, 1],
    ["Title", d.title.trim() || "–", 1],
    ["Steps", `${stepsArr.length} steps`, 1],
    ["Spaces", `${d.picked.join(", ")} · ${fmt(reach)} members`, 2],
    ["Reward", `✦ ${d.reward} × ${fmt(d.cap)} completions`, 3],
    ["Runs for", `${d.days} days`, 3],
    ["Held at launch", naira(total), 3],
  ];

  return (
    <>
      <PortalHeader title={d.editId ? "Edit Quest" : "New Quest"} sub={`Step ${step} of 4`} back="/business/quests" />
      <ol className="flex max-w-[760px] gap-1.5">
        {STEPS.map((label, i) => (
          <li key={label} className="flex-1">
            <button type="button" onClick={() => goStep(i + 1)} disabled={i + 1 > step} aria-current={i + 1 === step ? "step" : undefined} className="flex w-full flex-col gap-1.5 text-left disabled:cursor-default">
              <span className={cx("h-1 rounded-full", i + 1 <= step ? "bg-orange" : "bg-raised")} />
              <span className={cx("text-xs", i + 1 === step ? "text-ink" : "text-muted")}>{label}</span>
            </button>
          </li>
        ))}
      </ol>
      <div className="flex flex-wrap items-start gap-6">
        <div className="flex max-w-[640px] flex-[1_1_420px] flex-col gap-4">
          {step === 1 && (
            <>
              <h2 className="text-[15px] font-semibold">What should people do?</h2>
              <div role="radiogroup" aria-label="Task" className="flex flex-col gap-2">
                {TASKS.map((t) => (
                  <Radio key={t.id} on={d.task === t.id} label={t.label} help={t.help} onPick={() => up({ task: t.id, verify: "" })} />
                ))}
              </div>
              <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
                Quest title
                <input value={d.title} onChange={(e) => up({ title: e.target.value.slice(0, 80) })} placeholder="Accept your first test payment" className={cx(inputCls, "h-[46px]", tried && titleBad ? "border-err" : "border-line")} />
                <span className={cx("text-xs font-normal", tried && titleBad ? "text-err" : "text-muted")}>{tried && titleBad ? "Give it a title of at least 8 characters." : `Say what members will do, in plain words. ${d.title.length} / 80`}</span>
              </label>
              <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
                Steps for members
                <textarea value={d.steps} onChange={(e) => up({ steps: e.target.value })} rows={4} placeholder="One step per line" className={cx(inputCls, "resize-y border-line py-3 text-sm leading-normal")} />
                <span className="text-xs font-normal text-muted">Up to 5 steps. Members see them in order.</span>
              </label>
              <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
                {task.vLabel}
                <input value={d.verify} onChange={(e) => up({ verify: e.target.value })} placeholder={task.vPh} className={cx(inputCls, "mono h-[46px] border-line text-sm")} />
                <span className="text-xs font-normal text-muted">{task.vHelp}</span>
              </label>
            </>
          )}
          {step === 2 && (
            <>
              <h2 className="text-[15px] font-semibold">Who sees it?</h2>
              <span className="text-[13px] leading-normal text-muted">Quests only show in the Spaces you pick. Leaders can turn Quests off in their Space, so reach can change.</span>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-2">
                {SPACES.map(([n, count]) => {
                  const on = d.picked.includes(n);
                  return (
                    <button
                      key={n}
                      type="button"
                      role="checkbox"
                      aria-checked={on}
                      onClick={() => up({ picked: on ? d.picked.filter((x) => x !== n) : [...d.picked, n] })}
                      className={cx("tap flex min-h-14 items-center gap-2.5 rounded-xl border px-3 py-2 text-left", on ? "border-orange bg-warm" : "border-line hover:border-muted")}
                    >
                      <span className={cx("flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 text-xs text-black", on ? "border-orange bg-orange" : "border-line")}>{on ? "✓" : ""}</span>
                      <span className="flex flex-col">
                        <span className="text-sm font-semibold">{n}</span>
                        <span className="mono text-xs text-muted">{fmt(count)} members</span>
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="flex justify-between gap-3 rounded-xl bg-raised px-3.5 py-3 text-sm">
                <span>Estimated reach</span>
                <span className="mono">{fmt(reach)} members</span>
              </div>
              {tried && !d.picked.length && (
                <span role="alert" className="text-xs text-err">
                  Pick at least one Space.
                </span>
              )}
            </>
          )}
          {step === 3 && (
            <>
              <h2 className="text-[15px] font-semibold">Reward and budget</h2>
              <div className="flex flex-col gap-2">
                <span className="text-[13px] font-semibold">Sparks per completion</span>
                <div className="flex flex-wrap gap-1.5">
                  {[10, 20, 30, 40, 50].map((v) => (
                    <button key={v} type="button" aria-pressed={d.reward === v} onClick={() => up({ reward: v })} className={cx("tap mono flex min-h-10 items-center rounded-full border px-3.5 text-[13px]", pickClass(d.reward === v))}>
                      ✦ {v}
                    </button>
                  ))}
                </div>
                <span className="text-xs text-muted">
                  ✦ {d.reward} is {naira(d.reward * SPARK_NGN)} per member. Bigger rewards fill faster.
                </span>
              </div>
              <label className="flex flex-col gap-2 text-[13px] font-semibold">
                Completions cap · {fmt(d.cap)}
                <input type="range" min={100} max={5000} step={100} value={d.cap} onChange={(e) => up({ cap: +e.target.value })} className="accent-orange" />
              </label>
              <div className="flex flex-col gap-2">
                <span className="text-[13px] font-semibold">Runs for</span>
                <div className="flex flex-wrap gap-1.5">
                  {[7, 14, 30].map((n) => (
                    <button key={n} type="button" aria-pressed={d.days === n} onClick={() => up({ days: n })} className={cx("tap flex min-h-10 items-center rounded-full border px-3.5 text-[13px]", pickClass(d.days === n))}>
                      {n} days
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-2 rounded-[14px] border border-line p-4">
                {(
                  [
                    ["Member rewards", naira(rewardsN), false],
                    ["Platform fee (15%)", naira(fee), false],
                    ["Held at launch", naira(total), true],
                  ] as const
                ).map(([k, v, strong]) => (
                  <div key={k} className={cx("flex justify-between gap-3 text-sm", strong && "font-semibold")}>
                    <span className={strong ? "text-ink" : "text-muted"}>{k}</span>
                    <span className="mono">{v}</span>
                  </div>
                ))}
                <span className="text-xs leading-normal text-muted">We hold the total when the Quest launches and charge only for verified completions plus the fee on them. Anything unused comes back when the Quest ends or you cancel it.</span>
              </div>
              <span className={cx("text-xs", canFund ? "text-muted" : "text-err")}>
                {b.pay === "card"
                  ? `Held on your default card, •••• ${defCard?.last}.`
                  : canFund
                    ? `Held from your prepaid balance of ${naira(b.balance)}.`
                    : `Your prepaid balance is ${naira(b.balance)}. Add ${naira(total - b.balance)} in Billing, or lower the cap.`}
              </span>
            </>
          )}
          {step === 4 && (
            <>
              <h2 className="text-[15px] font-semibold">Check and submit</h2>
              <div className="flex flex-col rounded-[14px] border border-line">
                {summary.map(([k, v, n]) => (
                  <div key={k} className="flex min-h-12 items-center justify-between gap-4 border-b border-raised px-3.5 py-2 text-sm last:border-b-0">
                    <span className="text-muted">{k}</span>
                    <span className="ml-auto text-right">{v}</span>
                    <button type="button" onClick={() => goStep(n)} className="tap text-[13px] font-semibold text-lift">
                      Edit
                    </button>
                  </div>
                ))}
              </div>
              <span className="text-[13px] leading-normal text-muted">Heurekka reviews every Quest before it goes live, usually within 1 business day. Quests can&apos;t ask for personal data beyond an email.</span>
            </>
          )}
          <div className="flex flex-wrap gap-2.5 pt-1">
            {step > 1 && (
              <Button onClick={() => goStep(step - 1)}>Back</Button>
            )}
            <Button kind="primary" onClick={next}>
              {step < 4 ? "Continue" : b.verified ? "Submit for review" : "Save for after verification"}
            </Button>
            <Button kind="ghost" onClick={saveDraft}>
              Save draft
            </Button>
          </div>
        </div>
        <aside className="flex max-w-full flex-[0_0_340px] flex-col gap-2.5" aria-label="Member preview">
          <span className="text-[11px] font-semibold tracking-[0.08em] text-muted uppercase">How members will see it</span>
          {/* The preview is always the app's dark theme, whatever the portal theme is. */}
          <div className="flex flex-col gap-2 rounded-[18px] border border-[#2C3B49] bg-[#16202A] p-4 text-[#E8EDF2]">
            <div className="flex justify-between gap-3">
              <span className="text-[11px] font-semibold tracking-[0.1em] text-[#C9D4DE] uppercase">
                {d.task === "placement" ? "Placement challenge" : "Partner Quest"} · {b.biz.name || "Your business"}
              </span>
              <span className="mono text-[13px] text-gold">+✦ {d.reward}</span>
            </div>
            <span className="text-[17px] leading-snug font-semibold">{d.title.trim() || "Your Quest title"}</span>
            <span className="text-[13px] text-[#93A3B1]">
              {fmt(d.cap)} spots · {d.picked.slice(0, 2).join(", ")}
              {d.picked.length > 2 ? ` +${d.picked.length - 2}` : ""}
            </span>
          </div>
          <div className="flex flex-col gap-2.5 rounded-[18px] border border-[#2C3B49] bg-[#0E151C] p-4 text-[#E8EDF2]">
            <span className="text-[11px] font-semibold tracking-[0.1em] text-[#FF8C3F] uppercase">
              {d.task === "placement" ? "Placement challenge" : "Partner Quest"} · Sponsored by {b.biz.name || "Your business"}
            </span>
            <span className="text-[13px] font-semibold">Steps</span>
            {(stepsArr.length ? stepsArr : ["Your first step"]).map((text, i) => (
              <div key={i} className="flex gap-2.5 text-[13px] leading-normal">
                <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-[#1E2B37] text-[11px] font-bold">{i + 1}</span>
                <span>{text}</span>
              </div>
            ))}
            <span className="flex min-h-11 items-center justify-center rounded-full bg-orange text-sm font-semibold text-black">Start Quest</span>
          </div>
        </aside>
      </div>
    </>
  );
}
