import { QuestDetail } from "./quest-detail";

export default async function QuestPage({ params }: PageProps<"/business/quests/[id]">) {
  const { id } = await params;
  return <QuestDetail key={id} id={id} />;
}
