"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button, Card, Field, Input, Mark, SearchInput, cx } from "@/components/ui";
import { ACCESS, type Role } from "@/lib/admin-data";
import { AdminApiError, useAdminData, type Overview, type StaffMe } from "./admin-api";
import { useAdmin } from "./admin-store";

const NAV: { href: string; key: string; label: string }[] = [
  { href: "/admin", key: "dashboard", label: "Dashboard" },
  { href: "/admin/queue", key: "queue", label: "Review queue" },
  { href: "/admin/live", key: "live", label: "Live Buzz" },
  { href: "/admin/users", key: "users", label: "Users" },
  { href: "/admin/spaces", key: "spaces", label: "Spaces and Leaders" },
  { href: "/admin/announcements", key: "announcements", label: "Announcements" },
  { href: "/admin/finance", key: "finance", label: "Finance" },
  { href: "/admin/shop", key: "shop", label: "Shop" },
  { href: "/admin/reviews", key: "reviews", label: "Leader Reviews" },
  { href: "/admin/economy", key: "economy", label: "Economy settings" },
  { href: "/admin/data", key: "data", label: "Data requests" },
  { href: "/admin/staff", key: "staff", label: "Staff and access" },
  { href: "/admin/rules", key: "rules", label: "Rules" },
  { href: "/admin/audit", key: "audit", label: "Audit log" },
];

export const canAccess = (key: string, role: Role) => !ACCESS[key] || ACCESS[key].includes(role);

/** Fixed 220px sidebar, content fills the rest. */
export function AdminShell({ children }: { children: ReactNode }) {
  const a = useAdmin();
  const path = usePathname();
  // Real queue counts (reports, appeals, clips), refreshed on each page change.
  const moderates = a.session === "signed-in" && a.role !== "Finance";
  const overview = useAdminData<Overview>(moderates ? `overview#${path}` : null);
  const q = overview.data;
  if (a.session === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ground">
        <Mark size={36} />
      </div>
    );
  }
  if (a.session === "signed-out") return <AdminLogin />;

  const real = q ? q.queue.openReports + q.queue.openAppeals + q.totals.clipsUnderReview : 0;
  const counts: Record<string, number | undefined> = { queue: a.queueCount + real, live: a.liveCount, data: a.dataCount };
  const current = NAV.find((n) => (n.href === "/admin" ? path === "/admin" : path.startsWith(n.href)))?.key ?? "dashboard";

  return (
    <div className="flex min-h-screen flex-wrap bg-ground text-ink">
      <nav className="flex w-full shrink-0 flex-col gap-[22px] border-b border-raised bg-card px-3.5 py-[22px] md:sticky md:top-0 md:h-screen md:w-[220px] md:overflow-y-auto md:border-r md:border-b-0">
        <div className="flex items-center gap-2.5 px-2">
          <Mark size={28} />
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-[-0.02em]">Heurekka</span>
            <span className="mono text-[10px] uppercase tracking-[0.12em] text-muted">Admin</span>
          </div>
        </div>
        <GlobalSearch />
        <div className="flex flex-col gap-1">
          {NAV.filter((n) => canAccess(n.key, a.role)).map((n) => (
            <Link
              key={n.key}
              href={n.href}
              className={cx("tap flex min-h-11 items-center justify-between gap-2 rounded-[10px] px-3 text-sm font-medium", current === n.key ? "bg-raised text-ink" : "text-muted hover:text-ink")}
            >
              {n.label}
              {counts[n.key] ? <span className="mono text-xs text-lift">{counts[n.key]}</span> : null}
            </Link>
          ))}
        </div>
        <div className="mt-auto flex flex-col gap-2 px-1">
          <span className="mono text-[10px] uppercase tracking-[0.12em] text-muted">Signed in as</span>
          <div className="flex flex-col gap-0.5 px-0.5">
            <span className="truncate text-sm font-semibold">{a.me?.name}</span>
            <span className="truncate text-xs text-muted">
              {a.role} · {a.me?.email}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1.5">
            <ThemeToggle />
            <Button kind="ghost" size="sm" onClick={a.signOut} className="mono min-h-9 text-[11px] uppercase tracking-[0.06em]">
              Sign out
            </Button>
          </div>
        </div>
      </nav>
      <main className="flex min-w-0 flex-[1_1_640px] flex-col gap-[18px] px-4 py-6 md:px-8">
        {canAccess(current, a.role) ? (
          children
        ) : (
          <Card className="flex max-w-[520px] flex-col gap-3 rounded-2xl p-[26px]">
            <span className="text-[19px] font-bold">This section isn&apos;t part of the {a.role} role.</span>
            <span className="text-sm text-muted">Ask an admin if you need access. Everything you can open is in the sidebar.</span>
            <Link href="/admin" className="text-sm font-semibold text-lift">
              Back to the dashboard →
            </Link>
          </Card>
        )}
      </main>
    </div>
  );
}

/** Finds admin pages, and hands people and Space searches to their pages. */
function GlobalSearch() {
  const a = useAdmin();
  const router = useRouter();
  const [q, setQ] = useState("");
  const needle = q.trim().toLowerCase();
  const results: { group: string; label: string; sub: string; href: string }[] = !needle
    ? []
    : [
        { group: "Users", label: `Find people matching “${q.trim()}”`, sub: "name, handle or email", href: `/admin/users?q=${encodeURIComponent(q.trim())}` },
        ...(canAccess("spaces", a.role) ? [{ group: "Spaces", label: `Find Spaces matching “${q.trim()}”`, sub: "", href: `/admin/spaces?q=${encodeURIComponent(q.trim())}` }] : []),
        ...NAV.filter((n) => canAccess(n.key, a.role) && n.label.toLowerCase().includes(needle)).map((n) => ({ group: "Pages", label: n.label, sub: "", href: n.href })),
      ].slice(0, 8);
  const go = (href: string) => {
    setQ("");
    router.push(href);
  };
  return (
    <div className="relative px-1">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (results[0]) go(results[0].href);
        }}
      >
        <SearchInput value={q} onChange={setQ} placeholder="Search admin" />
      </form>
      {needle && (
        <div className="absolute top-full right-1 left-1 z-30 mt-1 flex flex-col overflow-hidden rounded-xl border border-line bg-card shadow-[0_12px_30px_rgba(0,0,0,.35)] md:w-[300px]">
          {results.map((r, i) => (
            <button key={r.group + r.label + i} type="button" onClick={() => go(r.href)} className="flex flex-col gap-0.5 border-b border-raised px-3 py-2.5 text-left last:border-b-0 hover:bg-raised">
              <span className="text-sm font-semibold">{r.label}</span>
              <span className="mono text-[10px] uppercase tracking-[0.08em] text-muted">
                {r.group}
                {r.sub && ` · ${r.sub}`}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function PageHeader({ title, sub, action }: { title: string; sub: string; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-3">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-[-0.025em]">{title}</h1>
        <span className="text-sm text-muted">{sub}</span>
      </div>
      {action}
    </div>
  );
}

/**
 * Staff sign-in: password, then a 6-digit code from an authenticator app.
 * The first time, the staff member scans a QR code to set the app up.
 */
function AdminLogin() {
  const a = useAdmin();
  const [step, setStep] = useState<"password" | "enroll" | "code">("password");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [code, setCode] = useState("");
  const [ticket, setTicket] = useState("");
  const [qr, setQr] = useState<{ image: string; secret: string } | null>(null);
  const [err, setErr] = useState("");

  const post = async <T,>(path: string, body: unknown): Promise<T> => {
    let res: Response;
    try {
      res = await fetch(`/api/admin/session/${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    } catch {
      throw new AdminApiError(0, "NETWORK", "Couldn't reach the server. Check your connection and try again.");
    }
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new AdminApiError(res.status, json?.error?.code ?? "ERROR", json?.error?.message ?? "Something went wrong. Try again.");
    return json as T;
  };

  const next = async () => {
    setErr("");
    try {
      if (step === "password") {
        if (!/.+@.+\..+/.test(email) || !pw) return setErr("Enter your staff email and password.");
        const r = await post<{ step: "enroll" | "code"; ticket: string; qr?: string; secret?: string }>("start", { email, password: pw });
        setTicket(r.ticket);
        setQr(r.qr ? { image: r.qr, secret: r.secret! } : null);
        setStep(r.step);
        return;
      }
      if (!/^\d{6}$/.test(code)) return setErr("Enter the 6-digit code from your authenticator app.");
      const r = await post<{ staff: StaffMe }>("finish", { ticket, code });
      a.signedIn(r.staff);
    } catch (e) {
      const x = e as AdminApiError;
      // A stale ticket means starting over from the password.
      if (x.code === "TICKET_EXPIRED") {
        setStep("password");
        setCode("");
      }
      setErr(x.message);
    }
  };

  const title = step === "password" ? "Sign in" : step === "enroll" ? "Set up two-factor sign-in" : "Two-factor check";
  const sub =
    step === "password"
      ? "Staff only. Accounts are added by an admin."
      : step === "enroll"
        ? "Scan this with an authenticator app (Google Authenticator, 1Password, Authy), then enter the 6-digit code it shows."
        : `Enter the 6-digit code from your authenticator app for ${email}.`;

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="flex w-[380px] max-w-full flex-col gap-[18px] rounded-[20px] p-7">
        <div className="flex items-center gap-2.5">
          <Mark size={28} />
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-[-0.02em]">Heurekka</span>
            <span className="mono text-[10px] uppercase tracking-[0.12em] text-muted">Admin</span>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[22px] font-bold tracking-[-0.02em]">{title}</h1>
          <span className="text-sm leading-normal text-muted">{sub}</span>
        </div>
        {step === "enroll" && qr && (
          <div className="flex flex-col items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr.image} alt="QR code to add Heurekka Admin to your authenticator app" width={180} height={180} className="rounded-xl bg-white p-2" />
            <span className="mono break-all text-center text-[11px] text-muted">Can&apos;t scan? Enter this key: {qr.secret}</span>
          </div>
        )}
        <form
          className="flex flex-col gap-[18px]"
          onSubmit={(e) => {
            e.preventDefault();
          }}
        >
          {step === "password" ? (
            <>
              <Field label="Staff email">
                <Input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} className="min-h-12" />
              </Field>
              <Field label="Password">
                <Input type="password" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} className="min-h-12" />
              </Field>
            </>
          ) : (
            <Field label="6-digit code">
              <Input
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                value={code}
                placeholder="000000"
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="mono min-h-[52px] text-[22px] tracking-[0.3em]"
              />
            </Field>
          )}
          {err && <span className="text-[13px] leading-normal text-err">{err}</span>}
          <Button kind="primary" size="lg" type="submit" onClick={next}>
            {step === "password" ? "Continue" : "Verify and sign in"}
          </Button>
        </form>
        <span className="text-center text-xs leading-normal text-muted">
          {step === "password" ? "Two-factor sign-in is required for all staff." : "Lost your device? Ask an admin to reset your two-factor sign-in."}
        </span>
        {step !== "password" && (
          <button
            type="button"
            onClick={() => {
              setStep("password");
              setCode("");
              setErr("");
            }}
            className="text-center text-[13px] font-semibold text-lift"
          >
            Use a different account
          </button>
        )}
      </Card>
    </div>
  );
}
