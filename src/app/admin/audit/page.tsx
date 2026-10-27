"use client";

import { useEffect, useState } from "react";

import { SearchInput } from "@/components/ui";
import { Button } from "@/components/ui";
import { PageHeader } from "../admin-shell";
import { ago, useAdminData, type AuditRow } from "../admin-api";
import { LoadError, Loading } from "../data-state";

const PAGE = 30;

/** Every staff action, with who did it and when. Admins only. */
export default function AuditPage() {
  const [q, setQ] = useState("");
  const [term, setTerm] = useState("");
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => {
      setTerm(q.trim());
      setOffset(0);
    }, 300);
    return () => clearTimeout(t);
  }, [q]);
  const list = useAdminData<{ total: number; items: AuditRow[] }>(`audit?q=${encodeURIComponent(term)}&offset=${offset}&limit=${PAGE}`);
  const data = list.data;
  return (
    <>
      <PageHeader title="Audit log" sub="Every staff action, with who did it and when." />
      <div className="flex max-w-[860px] flex-col gap-2.5">
        <SearchInput value={q} onChange={setQ} placeholder="Search by staff, action, or target" className="max-w-[420px]" />
        {list.error ? (
          <LoadError error={list.error} onRetry={list.reload} />
        ) : !data ? (
          <Loading rows={4} />
        ) : (
          <>
            <div className="flex flex-col overflow-hidden rounded-xl border border-line">
              {data.items.map((e) => (
                <div key={e.id} className="flex flex-wrap items-baseline gap-x-4 gap-y-1.5 border-b border-raised bg-card px-4 py-[13px] last:border-b-0">
                  <span className="mono w-[72px] shrink-0 text-xs text-muted" title={new Date(e.createdAt).toLocaleString("en-GB")}>
                    {ago(e.createdAt)}
                  </span>
                  <span className="w-[150px] shrink-0 text-[13px] text-soft">{e.who}</span>
                  <span className="flex-[1_1_240px] text-sm leading-snug">
                    <span className="font-semibold">{e.what}</span> · {e.target}
                  </span>
                </div>
              ))}
              {!data.items.length && <span className="bg-card px-4 py-6 text-center text-sm text-muted">{term ? <>No entries match &ldquo;{term}&rdquo;.</> : "Nothing logged yet."}</span>}
            </div>
            {data.total > PAGE && (
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-muted">
                  {offset + 1}–{Math.min(offset + PAGE, data.total)} of {data.total}
                </span>
                <div className="flex gap-2">
                  <Button size="sm" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - PAGE))}>
                    Newer
                  </Button>
                  <Button size="sm" disabled={offset + PAGE >= data.total} onClick={() => setOffset(offset + PAGE)}>
                    Older
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
