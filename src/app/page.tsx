import Link from "next/link";

import { ThemeToggle } from "@/components/theme-toggle";
import { Mark } from "@/components/ui";

const sections = [
  { href: "/admin", title: "Admin site", body: "Staff only. Dashboard, review queue, live Buzz, users, Spaces, announcements, finance, economy settings, data requests, staff, rules and audit log." },
  { href: "/studio", title: "Web Studio", body: "Creators on desktop. Analytics, items, Tool Kit versions, collaborators and splits, bundles, promotions and storefront." },
  { href: "/business", title: "Advertiser portal", body: "Heurekka for business. Public page, sign in, three-step sign-up with CAC and domain email checks, Quests table, results, Quest builder with live preview, billing in naira, team roles." },
  { href: "/studio/themes/editor", title: "Theme editor", body: "The desktop layout: sidebar sections, four live previews side by side, checks, version history." },
];

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 px-5 py-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Mark size={32} />
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-[-0.02em]">Heurekka</span>
            <span className="mono text-[10px] uppercase tracking-[0.12em] text-muted">Web prototype</span>
          </div>
        </div>
        <ThemeToggle />
      </div>
      <div className="flex flex-col gap-3">
        {sections.map((s) => (
          <Link key={s.href} href={s.href} className="tap flex flex-col gap-1.5 rounded-2xl border border-line bg-card p-5 hover:border-orange">
            <span className="text-[17px] font-semibold">{s.title}</span>
            <span className="text-sm leading-relaxed text-muted">{s.body}</span>
          </Link>
        ))}
      </div>
      <p className="text-xs text-muted">UI prototype with mock data. No server is connected yet.</p>
    </main>
  );
}
