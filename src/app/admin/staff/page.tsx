"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { Modal } from "@/components/modal";
import { Button, Chip, Field, Input, SectionLabel } from "@/components/ui";
import type { Role } from "@/lib/admin-data";
import { PageHeader } from "../admin-shell";
import { useAdmin } from "../admin-store";
import { ListDetail } from "../list-detail";

const ROLE_NOTE: Record<Role, string> = {
  Moderator: "Review queue, Live Buzz, Spaces and Leaders.",
  Finance: "Quest and advertiser reviews, payouts, Finance and Economy settings.",
  Admin: "Everything, including staff, rules, announcements, and data requests.",
};

/** Staff are invited by an admin and must use two-factor sign-in. */
export default function StaffPage() {
  return (
    <Suspense>
      <Staff />
    </Suspense>
  );
}

function Staff() {
  const a = useAdmin();
  const asked = useSearchParams().get("id") ?? undefined;
  const [key, setKey] = useState(0);
  const [selected, setSelected] = useState<string | undefined>(asked);
  // A new ?id= from the sidebar search selects that row.
  const [seen, setSeen] = useState(asked);
  if (asked !== seen) {
    setSeen(asked);
    setSelected(asked);
  }
  const [inviting, setInviting] = useState(false);

  const invite = (name: string, email: string, role: Role) => {
    const id = "st" + Date.now();
    a.set((s) => ({ staff: [...s.staff, { id, name, email, role, twofa: false, pending: true, last: "Not signed in", week: 0 }] }));
    a.act({ what: "Invited staff", target: `${name} (${role})`, msg: `Invite sent to ${email}` });
    setInviting(false);
    setSelected(id);
    setKey((k) => k + 1);
  };

  return (
    <>
      <PageHeader
        title="Staff and access"
        sub="Roles and sign-in. Two-factor sign-in is required for all staff."
        action={
          <Button kind="primary" onClick={() => setInviting(true)}>
            Invite staff
          </Button>
        }
      />
      <ListDetail key={`${key}-${asked}`} kind="staff" items={a.staff} initialId={selected} noun="staff" />
      {inviting && <InviteForm taken={a.staff.map((s) => s.email.toLowerCase())} onClose={() => setInviting(false)} onInvite={invite} />}
    </>
  );
}

function InviteForm({ taken, onClose, onInvite }: { taken: string[]; onClose: () => void; onInvite: (name: string, email: string, role: Role) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("Moderator");
  const [err, setErr] = useState<{ name?: string; email?: string }>({});

  const submit = () => {
    const e: typeof err = {};
    const em = email.trim().toLowerCase();
    if (name.trim().length < 2) e.name = "Enter their full name.";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) e.email = "Enter a valid email address.";
    else if (!em.endsWith("@heurekka.app")) e.email = "Staff must use a heurekka.app address.";
    else if (taken.includes(em)) e.email = "This person already has access or a pending invite.";
    setErr(e);
    if (!Object.keys(e).length) onInvite(name.trim(), em, role);
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Invite staff"
      sub="They get an email link that expires in 48 hours, and must set up two-factor sign-in on first sign-in."
      width={480}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button kind="primary" onClick={submit}>
            Send invite
          </Button>
        </>
      }
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <Field label="Full name" error={err.name}>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ngozi Okafor" />
        </Field>
        <Field label="Work email" error={err.email}>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@heurekka.app" />
        </Field>
        <div className="flex flex-col gap-2">
          <SectionLabel>Role</SectionLabel>
          <div className="flex flex-wrap gap-1.5">
            {(["Moderator", "Finance", "Admin"] as Role[]).map((r) => (
              <Chip key={r} on={role === r} onClick={() => setRole(r)}>
                {r}
              </Chip>
            ))}
          </div>
          <span className="text-xs text-muted">{ROLE_NOTE[role]}</span>
        </div>
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}
