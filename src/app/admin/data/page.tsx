"use client";

import { useRouter } from "next/navigation";

import { DATAREQ } from "@/lib/admin-data";
import { PageHeader } from "../admin-shell";
import { useAdmin } from "../admin-store";
import { ListDetail } from "../list-detail";

/** Exports, deletions (30-day grace) and legal requests (court order required). */
export default function DataRequestsPage() {
  const a = useAdmin();
  const router = useRouter();
  return (
    <>
      <PageHeader title="Data requests" sub="Exports, deletions, and legal requests. Exports and deletions are due within 30 days." />
      <ListDetail kind="data" noun="requests" items={DATAREQ.filter((x) => !a.done[x.id])} onOpenUser={(uid) => router.push(`/admin/users?u=${uid}`)} />
    </>
  );
}
