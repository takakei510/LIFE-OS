

import { QuestBoard } from "./quest-board";
import Link from "next/link";
import { getLifeOsSnapshot } from "@/lib/notion/snapshot";

export const dynamic = "force-dynamic";

export default async function QuestsPage({ searchParams }: { searchParams: Promise<{ state?: string; q?: string }> }) {
  const { state, q } = await searchParams;
  const acceptedOnly = state === "accepted";
  const query = typeof q === "string" ? q.slice(0, 120) : "";
  const snapshot = await getLifeOsSnapshot();

  return (
    <main>
      <section className="hero compactHero">
        <p className="eyebrow">QUEST BOARD</p>
        <h1>次の冒険を選ぶ。</h1>
        <p className="lead">やるべきことではなく、世界に触れるきっかけを並べる場所です。</p>
      </section>

      <nav className="questTabs" aria-label="クエスト表示">
        <Link href="/quests" aria-current={!acceptedOnly ? "page" : undefined}>すべて</Link>
        <Link href="/quests?state=accepted" aria-current={acceptedOnly ? "page" : undefined}>受注中 {snapshot.quests.filter((quest) => quest.state === "Accepted").length}件</Link>
      </nav>
      <p className="muted">一覧から受注できます。取り消しも自由で、XPは減りません。</p>
      <Link className="notionLink" href="/guide">探索案内人に相談 →</Link>
      <QuestBoard initialQuery={query} key={JSON.stringify([acceptedOnly, query])} quests={snapshot.quests} source={snapshot.source} actionsEnabled={process.env.QUEST_ACTIONS_ENABLED === "true"} initialState={acceptedOnly ? "受注中" : "すべて"} />
    </main>
  );
}
