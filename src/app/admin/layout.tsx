import type { Metadata } from "next";

import { ConfirmProvider } from "@/components/modal";
import { ToastProvider } from "@/components/toast";
import { AdminShell } from "./admin-shell";
import { AdminStoreProvider } from "./admin-store";

export const metadata: Metadata = { title: "Heurekka Admin" };

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <ToastProvider>
      <ConfirmProvider>
        <AdminStoreProvider>
          <AdminShell>{children}</AdminShell>
        </AdminStoreProvider>
      </ConfirmProvider>
    </ToastProvider>
  );
}
