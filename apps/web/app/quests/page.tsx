import Link from "next/link";

import { QuestBoard } from "./quest-board";
import { getLifeOsSnapshot } from "@/lib/notion/snapshot";

export const dynamic = "force-dynamic";

export default async function QuestsPage() {
  const snapshot = await getLifeOsSnapshot();

  return (
    <main>
      <nav className="pageNav" aria-label="Primary navigation">
        <Link href="/">HOME</Link>
        <Link href="/achievements">ACHIEVEMENTS</Link>
        <Link className="pageNavActive" href="/quests">QUESTS</Link>
      </nav>

      <section className="hero compactHero">
        <p className="eyebrow">QUEST BOARD</p>
        <h1>次の冒険を選ぶ。</h1>
        <p className="lead">やるべきことではなく、世界に触れるきっかけを並べる場所です。</p>
      </section>

      <QuestBoard quests={snapshot.quests} source={snapshot.source} />
    </main>
  );
}
