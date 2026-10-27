import type { Metadata } from "next";

import { ToastProvider } from "@/components/toast";
import { ThemeEditor } from "./theme-editor";

export const metadata: Metadata = { title: "Theme editor · Heurekka Studio" };

export default async function ThemeEditorPage({ searchParams }: PageProps<"/studio/themes/editor">) {
  const { from } = await searchParams;
  return (
    <ToastProvider>
      <ThemeEditor from={typeof from === "string" ? from : undefined} />
    </ToastProvider>
  );
}
