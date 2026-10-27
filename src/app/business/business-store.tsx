"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

import { BUSINESS, CAMPAIGNS, CARDS, INVOICES, TEAM, type Business, type Campaign, type Card, type Invoice, type Member } from "@/lib/business-data";

export type PayMethod = "card" | "transfer";

type BusinessState = {
  biz: Business;
  pay: PayMethod;
  verified: boolean;
  campaigns: Campaign[];
  balance: number;
  topup: number;
  cards: Card[];
  invoices: Invoice[];
  team: Member[];
  weekly: boolean;
};

type BusinessApi = BusinessState & {
  set: (patch: Partial<BusinessState> | ((s: BusinessState) => Partial<BusinessState>)) => void;
  /** A brand-new account: unverified, empty, with the signer as the only Admin. */
  startFresh: (biz: Business, pay: PayMethod) => void;
};

const Ctx = createContext<BusinessApi | null>(null);

const seed = (): BusinessState => ({
  biz: BUSINESS,
  pay: "card",
  verified: true,
  campaigns: CAMPAIGNS,
  balance: 2_400_000,
  topup: 800_000,
  cards: CARDS,
  invoices: INVOICES,
  team: TEAM,
  weekly: true,
});

/** Advertiser account data shared by the public pages and the portal. Mock only. */
export function BusinessStoreProvider({ children }: { children: ReactNode }) {
  const [s, setS] = useState<BusinessState>(seed);
  const set: BusinessApi["set"] = (patch) => setS((cur) => ({ ...cur, ...(typeof patch === "function" ? patch(cur) : patch) }));
  const startFresh: BusinessApi["startFresh"] = (biz, pay) =>
    setS((cur) => ({ ...cur, biz, pay, verified: false, campaigns: [], balance: 0, invoices: [], team: [{ name: "You", email: biz.email, role: "admin", status: "You" }] }));
  return <Ctx.Provider value={{ ...s, set, startFresh }}>{children}</Ctx.Provider>;
}

export const useBusiness = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useBusiness outside BusinessStoreProvider");
  return v;
};
