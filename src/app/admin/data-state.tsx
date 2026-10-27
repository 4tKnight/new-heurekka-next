"use client";

import { Button, Card, Skeleton } from "@/components/ui";
import type { AdminApiError } from "./admin-api";

/** Placeholder rows while a section loads. */
export function Loading({ rows = 4 }: { rows?: number }) {
  return (
    <div className="flex max-w-[1040px] flex-col gap-2.5">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-2.5">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-[52px] border-0" />
      ))}
    </div>
  );
}

/** A section that didn't load: what happened, and a retry. */
export function LoadError({ error, onRetry }: { error: AdminApiError; onRetry: () => void }) {
  return (
    <Card className="flex max-w-[520px] flex-col gap-3 rounded-2xl p-[26px]">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-errbg text-xl font-bold text-err">!</span>
      <span className="text-[19px] font-bold tracking-[-0.02em]">This didn&apos;t load.</span>
      <span className="text-sm leading-relaxed text-muted">{error.message}</span>
      <Button kind="primary" className="self-start" onClick={onRetry}>
        Try again
      </Button>
    </Card>
  );
}

/** Marks a section that still shows prototype data until its stage ships. */
export function PrototypeNote({ children }: { children: string }) {
  return <span className="mono self-start rounded-md border border-dashed border-line px-2 py-1 text-[10px] uppercase tracking-[0.08em] text-muted">{children}</span>;
}
