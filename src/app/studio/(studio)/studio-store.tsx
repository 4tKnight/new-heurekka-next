"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

import { BUNDLES, PROMOS, SPLITS, VERSIONS, type Bundle, type Period, type Promo, type Split, type Version } from "@/lib/studio-data";

type StudioState = {
  period: Period;
  versions: Version[];
  splits: Record<string, Split[]>;
  bundles: Bundle[];
  promos: Promo[];
  bio: string;
  banner: number;
  featured: string[];
  notify: boolean;
};

type StudioApi = StudioState & { set: (patch: Partial<StudioState> | ((s: StudioState) => Partial<StudioState>)) => void };

const Ctx = createContext<StudioApi | null>(null);

/** Creator data that has to survive moving between Studio pages. Mock only. */
export function StudioStoreProvider({ children }: { children: ReactNode }) {
  const [s, setS] = useState<StudioState>({
    period: 30,
    versions: VERSIONS,
    splits: SPLITS,
    bundles: BUNDLES,
    promos: PROMOS,
    bio: "I build calm, readable things for people who ship at night. Themes, stickers and a UI kit.",
    banner: 0,
    featured: ["t1", "k1", "p1", "p2"],
    notify: true,
  });
  const set: StudioApi["set"] = (patch) => setS((cur) => ({ ...cur, ...(typeof patch === "function" ? patch(cur) : patch) }));
  return <Ctx.Provider value={{ ...s, set }}>{children}</Ctx.Provider>;
}

export const useStudio = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStudio outside StudioStoreProvider");
  return v;
};
