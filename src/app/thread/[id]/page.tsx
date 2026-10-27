import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { Mark } from "@/components/ui";
import { API } from "@/lib/hk-server";

/**
 * A thread shared from the app (heurekka.com/thread/<id>): readable without
 * the app, with a link preview, and a button that opens it in the app.
 * Only threads from public Spaces and open Labs exist here.
 */

type Person = { name: string; handle: string; displayName: string; avatarUrl: string | null; headline: string; isLeader: boolean };
type Image = { url: string; w: number; h: number };
type Clip = { url: string; poster: string; durationMs: number };
type PublicThread = {
  id: string;
  kind: "ask" | "feedback" | "showcase" | "discussion" | "opportunity";
  title: string;
  body: string;
  images: Image[];
  clip: Clip | null;
  author: Person;
  space: string;
  lab: string;
  replyCount: number;
  cheerCount: number;
  solved: boolean;
  createdAt: string;
  replies: { id: string; author: Person; body: string; images: Image[]; clip: Clip | null; cheerCount: number; accepted: boolean; createdAt: string }[];
};

const KIND: Record<PublicThread["kind"], string> = { ask: "Ask the room", feedback: "Get feedback", showcase: "Show what I built", discussion: "Discussion", opportunity: "Opportunity" };

async function load(id: string): Promise<PublicThread | null> {
  // Cached for a minute: shared links get opened in bursts.
  const res = await fetch(`${API}/public/threads/${encodeURIComponent(id)}`, { next: { revalidate: 60 } });
  return res.ok ? ((await res.json()) as PublicThread) : null;
}

/** A Cloudinary image at a sensible width for the page. */
const sized = (url: string, w: number) => url.replace("/image/upload/", `/image/upload/w_${w},c_limit,q_auto,f_auto/`);

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const t = await load((await params).id);
  if (!t) return { title: "Heurekka" };
  const description = (t.body || `${KIND[t.kind]} in ${t.space}`).replace(/\s+/g, " ").slice(0, 180);
  const image = t.images[0] ? sized(t.images[0].url, 1200) : t.clip?.poster;
  return {
    title: `${t.title} · Heurekka`,
    description,
    openGraph: { title: t.title, description, siteName: "Heurekka", type: "article", ...(image ? { images: [image] } : {}) },
    twitter: { card: image ? "summary_large_image" : "summary", title: t.title, description },
  };
}

const ago = (iso: string) => {
  const mins = (Date.now() - new Date(iso).getTime()) / 60000;
  if (mins < 60) return `${Math.max(1, Math.round(mins))}m`;
  if (mins < 1440) return `${Math.round(mins / 60)}h`;
  if (mins < 1440 * 7) return `${Math.round(mins / 1440)}d`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
};

/** @mentions in orange, the rest as written. */
function Body({ text, className }: { text: string; className?: string }) {
  const parts: ReactNode[] = [];
  text.split(/(@\w+)/g).forEach((p, i) => parts.push(p.startsWith("@") ? <span key={i} className="font-semibold text-lift">{p}</span> : p));
  return <p className={`whitespace-pre-wrap break-words leading-relaxed text-soft ${className ?? ""}`}>{parts}</p>;
}

function Author({ p, when, size = 36 }: { p: Person; when: string; size?: number }) {
  return (
    <div className="flex items-center gap-2.5">
      {p.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.avatarUrl} alt="" width={size} height={size} className="rounded-full object-cover" style={{ width: size, height: size }} />
      ) : (
        <span className="flex items-center justify-center rounded-full bg-raised text-sm font-bold" style={{ width: size, height: size }}>
          {p.name.slice(0, 1)}
        </span>
      )}
      <div className="flex min-w-0 flex-col">
        <span className="text-sm font-semibold">
          {p.displayName}
          {p.isLeader && <span className="mono ml-2 text-[10px] uppercase tracking-[0.08em] text-gold-ink">Leader</span>}
          <span className="mono ml-2 text-xs font-normal text-muted">{ago(when)}</span>
        </span>
        {p.headline && <span className="truncate text-xs text-muted">{p.headline}</span>}
      </div>
    </div>
  );
}

function Media({ images, clip }: { images: Image[]; clip: Clip | null }) {
  return (
    <>
      {images.length > 0 && (
        <div className={`grid gap-1 overflow-hidden rounded-xl ${images.length > 1 ? "grid-cols-2" : ""}`}>
          {images.map((im) => (
            <a key={im.url} href={im.url} target="_blank" rel="noreferrer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={sized(im.url, 1000)} alt="" loading="lazy" className={`w-full bg-raised object-cover ${images.length > 1 ? "aspect-square" : "max-h-[520px]"}`} />
            </a>
          ))}
        </div>
      )}
      {/* Plays only when someone presses play. */}
      {clip && <video src={clip.url} poster={clip.poster} controls preload="none" className="aspect-video w-full rounded-xl bg-black object-contain" />}
    </>
  );
}

export default async function ThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await load(id);
  if (!t) notFound();
  const open = `heurekka://app/thread/${t.id}`;

  return (
    <main className="mx-auto flex min-h-screen max-w-[680px] flex-col gap-6 px-4 py-6 sm:px-5 sm:py-10">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Mark size={28} />
          <span className="text-base font-bold tracking-[-0.02em]">Heurekka</span>
        </div>
        <a href={open} className="tap rounded-full bg-orange px-4 py-2.5 text-sm font-semibold text-black">
          Open in the app
        </a>
      </header>

      <article className="flex flex-col gap-4">
        <span className="mono text-[11px] uppercase tracking-[0.1em] text-lift">
          {t.space} · {t.lab}
        </span>
        <div className="flex flex-wrap items-center gap-2">
          {t.kind !== "ask" && <span className="rounded-full border border-line px-2.5 py-1 text-xs text-muted">{KIND[t.kind]}</span>}
          {t.solved && <span className="rounded-full bg-okbg px-2.5 py-1 text-xs font-semibold text-ok">Answered</span>}
        </div>
        <h1 className="text-[26px] font-bold leading-tight tracking-[-0.02em] sm:text-[30px]">{t.title}</h1>
        {t.body && <Body text={t.body} className="text-[16px]" />}
        <Media images={t.images} clip={t.clip} />
        <Author p={t.author} when={t.createdAt} />
        <span className="mono text-xs text-muted">
          {t.replyCount} {t.replyCount === 1 ? "reply" : "replies"} · {t.cheerCount} {t.cheerCount === 1 ? "cheer" : "cheers"}
        </span>
      </article>

      {t.replies.length > 0 && (
        <section className="flex flex-col gap-3 border-t border-raised pt-5">
          {t.replies.map((r) => (
            <div key={r.id} className={`flex flex-col gap-2.5 rounded-xl border p-4 ${r.accepted ? "border-ok" : "border-raised"}`}>
              {r.accepted && <span className="mono text-[10px] uppercase tracking-[0.1em] text-ok">Answer</span>}
              <Author p={r.author} when={r.createdAt} size={30} />
              {r.body && <Body text={r.body} className="text-[15px]" />}
              <Media images={r.images} clip={r.clip} />
            </div>
          ))}
        </section>
      )}

      <section className="flex flex-col items-start gap-2.5 rounded-2xl border border-line bg-card p-5">
        <span className="text-[17px] font-semibold">
          {t.replyCount > t.replies.length ? `See all ${t.replyCount} replies, and add yours, in the app.` : "Add your reply in the app."}
        </span>
        <span className="text-sm leading-relaxed text-muted">Heurekka is where builders ask the room, get feedback on their work, and get known for helping.</span>
        <a href={open} className="tap mt-1 rounded-full bg-orange px-5 py-3 text-sm font-semibold text-black">
          Open in Heurekka
        </a>
      </section>
    </main>
  );
}
