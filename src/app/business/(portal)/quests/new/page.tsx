import { QuestBuilder } from "./quest-builder";

/** `?edit=<id>` continues a draft; `?copy=<id>` starts from an existing Quest. */
export default async function NewQuestPage({ searchParams }: PageProps<"/business/quests/new">) {
  const { edit, copy } = await searchParams;
  const e = typeof edit === "string" ? edit : undefined;
  const c = typeof copy === "string" ? copy : undefined;
  return <QuestBuilder key={`${e ?? ""}|${c ?? ""}`} editId={e} copyId={c} />;
}
