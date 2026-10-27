import type { Metadata } from "next";

import { ToastProvider } from "@/components/toast";
import { StudioShell } from "./studio-shell";
import { StudioStoreProvider } from "./studio-store";

export const metadata: Metadata = { title: "Heurekka Creator Studio" };

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <StudioStoreProvider>
        <StudioShell>{children}</StudioShell>
      </StudioStoreProvider>
    </ToastProvider>
  );
}
