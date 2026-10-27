import { notFound } from "next/navigation";

import { itemById } from "@/lib/studio-data";
import { ItemDetail, type ItemTab } from "./item-detail";

export default async function ItemPage({ params, searchParams }: PageProps<"/studio/items/[id]">) {
  const { id } = await params;
  const { tab } = await searchParams;
  const item = itemById(id);
  if (!item) notFound();
  return <ItemDetail key={id} id={id} initialTab={(typeof tab === "string" ? tab : "stats") as ItemTab} />;
}
