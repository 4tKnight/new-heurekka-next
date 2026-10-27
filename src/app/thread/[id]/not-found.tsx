import { Mark } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-[520px] flex-col items-start justify-center gap-3 px-5">
      <Mark size={32} />
      <h1 className="text-[24px] font-bold tracking-[-0.02em]">This thread isn&apos;t available.</h1>
      <p className="text-sm leading-relaxed text-muted">It may have been deleted, or it&apos;s in a private Space or an invite-only Lab. If you&apos;re a member, open it in the Heurekka app.</p>
    </main>
  );
}
