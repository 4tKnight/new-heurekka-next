"use client";

import { useState } from "react";

import { useToast } from "@/components/toast";
import { Badge, Button, Chip, Field, Input } from "@/components/ui";
import { useAdmin } from "../admin-store";
import { adminPost, type AdminApiError, type Person } from "../admin-api";

/** Who runs a Space, and (for admins) assigning its owner or moderators by @handle. */
export function SpaceTeam({ spaceId, team, onChanged }: { spaceId: string; team: (Person & { role: string })[]; onChanged: () => void }) {
  const a = useAdmin();
  const toast = useToast();
  const [handle, setHandle] = useState("");
  const [role, setRole] = useState<"moderator" | "owner">("moderator");
  const [err, setErr] = useState("");
  const isAdmin = a.me?.staffRole === "admin";

  const assign = async (h: string, r: "owner" | "moderator" | "member") => {
    setErr("");
    try {
      await adminPost(`spaces/${spaceId}/roles`, { handle: h, role: r });
      toast(r === "member" ? "Removed from the team." : `@${h.replace(/^@/, "")} is ${r === "owner" ? "the owner" : "a moderator"} now.`);
      setHandle("");
      onChanged();
    } catch (e) {
      setErr((e as AdminApiError).message);
    }
  };

  return (
    <div className="flex flex-col gap-2.5 border-t border-raised pt-3.5">
      <span className="text-[13px] font-semibold text-muted">Who runs it</span>
      {team.map((m) => (
        <div key={m.id} className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">{m.name}</span>
          <span className="text-[13px] text-muted">@{m.handle}</span>
          <Badge tone={m.role === "owner" ? "gold" : "grey"}>{m.role === "owner" ? "Owner" : "Moderator"}</Badge>
          {isAdmin && m.role === "moderator" && (
            <Button size="sm" kind="text" onClick={() => assign(m.handle, "member")}>
              Remove
            </Button>
          )}
        </div>
      ))}
      {!team.length && <span className="text-[13px] text-muted">No owner or moderators yet. Staff look after it.</span>}
      {isAdmin && (
        <div className="flex flex-col gap-2 rounded-xl border border-raised bg-ground p-3">
          <div className="flex flex-wrap gap-1.5">
            <Chip on={role === "moderator"} onClick={() => setRole("moderator")}>
              Add moderator
            </Chip>
            <Chip on={role === "owner"} onClick={() => setRole("owner")}>
              Make owner
            </Chip>
          </div>
          <Field label="@handle" hint={role === "owner" ? "Owners must be Leaders. The current owner becomes a moderator." : undefined} error={err || undefined}>
            <Input value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="@ada" />
          </Field>
          <div className="flex justify-end">
            <Button kind="primary" size="sm" disabled={!handle.trim()} onClick={() => assign(handle, role)}>
              {role === "owner" ? "Make owner" : "Add moderator"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
