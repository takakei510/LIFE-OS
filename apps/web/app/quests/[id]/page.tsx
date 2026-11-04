import Link from "next/link";
import { notFound } from "next/navigation";
import { CategoryName } from "@/components/life-icons/life-icon";
import { getLifeOsSnapshot } from "@/lib/notion/snapshot";
import { normalizedId, questStateLabel } from "@/lib/life-os/quests/policy";
import { QuestControls } from "../quest-controls";

export const dynamic = "force-dynamic";

export default async function QuestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!normalizedId(id)) notFound();
  const snapshot = await getLifeOsSnapshot();
  if (snapshot.source !== "notion") throw new Error("クエストを読み込めませんでした。");
  const quest = snapshot.quests.find((item) => normalizedId(item.id) === normalizedId(id));
  if (!quest) notFound();
  return <main>
    <Link className="backLink" href="/quests">← クエストボードへ戻る</Link>
    <article className="achievementDetail questDetail">
      <div className="detailTopline"><CategoryName category={quest.category} /><span>{questStateLabel(quest.state)}</span></div>
      <p className="eyebrow">{quest.questType ?? "種類未設定"}</p>
      <h1>{quest.name || "名前未設定のクエスト"}</h1>
      <section className="detailSection"><h2>この体験について</h2><p className="questDescription">{quest.description || "説明はまだ設定されていません。"}</p></section>
      <section className="detailSection"><h2>達成条件</h2><p>{quest.completionCondition || "達成条件はまだ設定されていません。"}</p></section>
      <p className="muted">Notionに設定された達成報酬：{quest.rewardXp} XP。受注・取り消しでは加算されません。</p>
      <QuestControls quest={quest} enabled={process.env.QUEST_ACTIONS_ENABLED === "true"} />
      <a className="notionLink" href={quest.url} target="_blank" rel="noreferrer">Notionの記録を開く ↗</a>
    </article>
  </main>;
}
