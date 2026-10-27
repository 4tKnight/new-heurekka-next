"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { cx } from "@/components/ui";
import { QUEUE_DATA, ROLE_TABS, TAB_LABEL, type QueueTab } from "@/lib/admin-data";
import { PageHeader } from "../admin-shell";
import { useAdmin } from "../admin-store";
import { ListDetail } from "../list-detail";
import { useAdminData, type Overview } from "../admin-api";
import { PrototypeNote } from "../data-state";
import { AppealsQueue } from "./appeals";
import { ClipsQueue } from "./clips";
import { LeaderCandidates } from "./leaders";
import { ReportsQueue } from "./reports";

/** Tabs backed by the real API. The others show prototype data until their stage ships. */
const REAL = ["reports", "appeals", "clips", "leaders"] as const;
type RealTab = (typeof REAL)[number];

function Queue() {
  const a = useAdmin();
  const router = useRouter();
  const params = useSearchParams();
  const moderates = a.role !== "Finance";
  const real: RealTab[] = moderates ? [...REAL] : [];
  const proto: QueueTab[] = ROLE_TABS[a.role].filter((t) => t !== "reports" && t !== "appeals");
  const asked = params.get("tab");
  const tab: RealTab | QueueTab = real.includes(asked as RealTab) || proto.includes(asked as QueueTab) ? (asked as RealTab | QueueTab) : (real[0] ?? proto[0]!);
  const overview = useAdminData<Overview>(moderates ? "overview" : null);
  const q = overview.data;
  const counts: Record<RealTab, number | undefined> = { reports: q?.queue.openReports, appeals: q?.queue.openAppeals, clips: q?.totals.clipsUnderReview, leaders: undefined };
  const labels: Record<RealTab, string> = { reports: "Reports", appeals: "Appeals", clips: "Clips", leaders: "Leader candidates" };
  const isProto = !real.includes(tab as RealTab);
  const items = isProto ? (QUEUE_DATA[tab as QueueTab] as readonly { id: string }[]).filter((x) => !a.done[x.id]) : [];

  const tabButton = (key: string, label: string, n: number | string | undefined, urgent = false) => (
    <button
      key={key}
      type="button"
      onClick={() => router.replace(`/admin/queue?tab=${key}`)}
      className={cx("-mb-px flex min-h-11 items-center gap-2 border-b-2 px-3.5 text-sm font-semibold", key === tab ? "border-orange text-ink" : "border-transparent text-muted hover:text-ink")}
    >
      {label}
      <span className={cx("mono min-w-5 rounded-full px-[7px] py-0.5 text-center text-[11px]", urgent ? "bg-errbg text-err" : "bg-raised text-soft")}>{n ?? "·"}</span>
    </button>
  );

  return (
    <>
      <PageHeader title="Review queue" sub="Most urgent first. Safety reports are handled within hours, spam within a day." />
      <div className="flex flex-wrap gap-1.5 border-b border-raised">
        {real.map((t) => tabButton(t, labels[t], counts[t], t === "reports" && !!q?.queue.urgentReports))}
        {proto.map((t) => tabButton(t, TAB_LABEL[t], a.openCount(t)))}
      </div>
      {tab === "reports" ? (
        <ReportsQueue onChanged={overview.reload} />
      ) : tab === "appeals" ? (
        <AppealsQueue onChanged={overview.reload} />
      ) : tab === "clips" ? (
        <ClipsQueue />
      ) : tab === "leaders" ? (
        <LeaderCandidates />
      ) : (
        <>
          <PrototypeNote>Prototype data until this stage ships</PrototypeNote>
          <ListDetail key={tab} kind={tab as QueueTab} noun={TAB_LABEL[tab as QueueTab].toLowerCase()} items={[...items]} onOpenUser={(uid) => router.push(`/admin/users?u=${uid}`)} />
        </>
      )}
    </>
  );
}

export default function QueuePage() {
  return (
    <Suspense>
      <Queue />
    </Suspense>
  );
}
