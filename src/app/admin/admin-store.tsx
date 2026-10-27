"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { useToast } from "@/components/toast";
import {
  AUDIT,
  DATAREQ,
  ECON,
  LIVE,
  QUEUE_DATA,
  ROLE_TABS,
  RULES,
  SENT,
  SPACES,
  STAFF,
  USERS,
  type Announcement,
  type AuditEntry,
  type EconRow,
  type QueueTab,
  type Role,
  type Rule,
  type SpaceRow,
  type Staff,
  type User,
} from "@/lib/admin-data";
import { AdminApiError, type StaffMe, type StaffRole } from "./admin-api";

/** The prototype's role names, used by the sections still on prototype data. */
const ROLE_OF: Record<StaffRole, Role> = { moderator: "Moderator", finance: "Finance", admin: "Admin" };

type AdminState = {
  /** The real staff session, checked with the server on load. */
  session: "checking" | "signed-out" | "signed-in";
  me: StaffMe | null;
  role: Role;
  /** Queue, live and data items that have been actioned. */
  done: Record<string, boolean>;
  users: User[];
  staff: Staff[];
  spaces: SpaceRow[];
  rules: Rule[];
  econ: EconRow[];
  refunded: Record<string, boolean>;
  sent: Announcement[];
  audit: AuditEntry[];
};

type AdminApi = AdminState & {
  set: (patch: Partial<AdminState> | ((s: AdminState) => Partial<AdminState>)) => void;
  /** Logs an action to the audit log, shows a toast, optionally marks an item done and patches a user's status. */
  act: (args: { id?: string; what: string; target: string; msg: string; userStatus?: { id: string; status: string } }) => void;
  openCount: (tab: QueueTab) => number;
  queueCount: number;
  liveCount: number;
  dataCount: number;
  signedIn: (me: StaffMe) => void;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AdminApi | null>(null);

export function AdminStoreProvider({ children }: { children: ReactNode }) {
  const toast = useToast();
  const [s, setS] = useState<AdminState>({
    session: "checking",
    me: null,
    role: "Moderator",
    done: {},
    users: USERS,
    staff: STAFF,
    spaces: SPACES,
    rules: RULES,
    econ: ECON,
    refunded: {},
    sent: SENT,
    audit: AUDIT,
  });

  // Is someone already signed in? The session lives in httpOnly cookies.
  useEffect(() => {
    fetch("/api/admin/session", { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new AdminApiError(r.status, "", "");
        const me = (await r.json()) as StaffMe;
        setS((p) => ({ ...p, session: "signed-in", me, role: ROLE_OF[me.staffRole] }));
      })
      .catch(() => setS((p) => ({ ...p, session: "signed-out", me: null })));
  }, []);

  const set = useCallback((patch: Partial<AdminState> | ((s: AdminState) => Partial<AdminState>)) => {
    setS((prev) => ({ ...prev, ...(typeof patch === "function" ? patch(prev) : patch) }));
  }, []);

  const act = useCallback<AdminApi["act"]>(
    ({ id, what, target, msg, userStatus }) => {
      setS((prev) => ({
        ...prev,
        done: id ? { ...prev.done, [id]: true } : prev.done,
        audit: [{ id: "a" + Date.now(), time: "now", who: `You (${prev.role})`, what, target }, ...prev.audit],
        users: userStatus ? prev.users.map((u) => (u.id === userStatus.id ? { ...u, status: userStatus.status } : u)) : prev.users,
      }));
      toast(msg);
    },
    [toast],
  );

  const signedIn = useCallback((me: StaffMe) => setS((p) => ({ ...p, session: "signed-in", me, role: ROLE_OF[me.staffRole] })), []);
  const signOut = useCallback(async () => {
    await fetch("/api/admin/session", { method: "DELETE" }).catch(() => undefined);
    setS((p) => ({ ...p, session: "signed-out", me: null }));
  }, []);

  const api = useMemo<AdminApi>(() => {
    const openCount = (tab: QueueTab) => (QUEUE_DATA[tab] as readonly { id: string }[]).filter((x) => !s.done[x.id]).length;
    return {
      ...s,
      set,
      act,
      signedIn,
      signOut,
      openCount,
      // Reports and appeals are real now; the shell adds their counts from the API.
      queueCount: ROLE_TABS[s.role].filter((t) => t !== "reports" && t !== "appeals").reduce((n, t) => n + openCount(t), 0),
      liveCount: LIVE.filter((x) => !s.done[x.id]).length,
      dataCount: DATAREQ.filter((x) => !s.done[x.id]).length,
    };
  }, [s, set, act, signedIn, signOut]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useAdmin() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAdmin must be used inside AdminStoreProvider");
  return v;
}
