import Link from "next/link";

import { ThemeToggle } from "@/components/theme-toggle";
import { Kicker, Mark } from "@/components/ui";

const points = [
  { title: "Pay per verified result", body: "We verify every completion with your sandbox, a code or a test run. Bots and repeats are removed before you're charged." },
  { title: "Reach the right Spaces", body: "Pick the Spaces your Quest shows in, from Web Development to AI. You see estimated reach before you launch." },
  { title: "Results you can export", body: "Completions by day and by Space, cost per completion, and CSV exports for your team." },
];

/** Public page. Anyone can see it; the portal needs a business account. */
export default function BusinessLanding() {
  return (
    <div className="flex min-h-screen flex-col bg-ground text-ink">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-raised px-[clamp(16px,4vw,48px)] py-4">
        <Link href="/" className="flex items-center gap-2.5">
          <Mark size={28} />
          <span className="text-base font-bold tracking-[-0.02em]">Heurekka</span>
          <span className="mono text-[10px] uppercase tracking-[0.12em] text-muted">for business</span>
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <ThemeToggle className="mr-2" />
          <Link href="/business/sign-in" className="tap inline-flex min-h-11 items-center rounded-full border border-line px-[18px] text-sm font-semibold hover:border-muted">
            Sign in
          </Link>
          <Link href="/business/sign-up" className="tap inline-flex min-h-11 items-center rounded-full border border-orange bg-orange px-[18px] text-sm font-semibold text-[#1A0E03] hover:bg-orange-pressed">
            Create an account
          </Link>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-[1080px] flex-1 flex-col gap-10 px-[clamp(16px,4vw,48px)] py-[clamp(32px,6vw,80px)]">
        <div className="flex max-w-[720px] flex-col gap-4">
          <Kicker>Quests</Kicker>
          <h1 className="text-[clamp(32px,5vw,48px)] leading-[1.08] font-bold tracking-[-0.03em]">Get Nigerian developers to try your product. Pay only when they do.</h1>
          <p className="max-w-[600px] text-[17px] leading-relaxed text-soft">
            A Quest asks members to do one real thing: make a test API call, finish a tutorial, attend a Buzz session. They earn Sparks. You pay in naira for each verified completion, plus a 15% fee.
          </p>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))] gap-3">
          {points.map((p) => (
            <div key={p.title} className="flex flex-col gap-2 rounded-2xl border border-line bg-card p-5">
              <span className="text-base font-semibold">{p.title}</span>
              <span className="text-sm leading-relaxed text-muted">{p.body}</span>
            </div>
          ))}
        </div>
        <p className="text-[13px] leading-relaxed text-muted">
          You&apos;ll need a CAC-registered business and a work email on your company&apos;s domain. We check every advertiser before their first Quest goes live, usually within 1 business day.
        </p>
      </main>
    </div>
  );
}
