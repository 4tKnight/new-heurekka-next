import type { Metadata } from "next";

import { ToastProvider } from "@/components/toast";
import { BusinessStoreProvider } from "./business-store";

export const metadata: Metadata = { title: "Heurekka for business" };

export default function BusinessLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <BusinessStoreProvider>{children}</BusinessStoreProvider>
    </ToastProvider>
  );
}
