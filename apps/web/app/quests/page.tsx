

import { QuestBoard } from "./quest-board";
import { getLifeOsSnapshot } from "@/lib/notion/snapshot";

export const dynamic = "force-dynamic";

export default async function QuestsPage() {
  const snapshot = await getLifeOsSnapshot();

  return (
    <main>
      <section className="hero compactHero">
        <p className="eyebrow">QUEST BOARD</p>
        <h1>次の冒険を選ぶ。</h1>
        <p className="lead">やるべきことではなく、世界に触れるきっかけを並べる場所です。</p>
      </section>

      <QuestBoard quests={snapshot.quests} source={snapshot.source} />
    </main>
  );
}
