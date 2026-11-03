import Link from "next/link";

import { QuestBoard } from "./quest-board";
import { getLifeOsSnapshot } from "@/lib/notion/snapshot";

export const dynamic = "force-dynamic";

export default async function QuestsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const query = (await searchParams).q;
  const snapshot = await getLifeOsSnapshot();

  return (
    <main>
      <nav className="pageNav" aria-label="Primary navigation">
        <Link href="/">HOME</Link>
        <Link href="/achievements">ACHIEVEMENTS</Link>
        <Link className="pageNavActive" href="/quests">QUESTS</Link>
        <Link href="/guide">探索案内人に相談</Link>
      </nav>

      <section className="hero compactHero">
        <p className="eyebrow">QUEST BOARD</p>
        <h1>次の冒険を選ぶ。</h1>
        <p className="lead">やるべきことではなく、世界に触れるきっかけを並べる場所です。</p>
      </section>

      <QuestBoard key={typeof query === "string" ? query : ""} quests={snapshot.quests} source={snapshot.source} initialQuery={typeof query === "string" ? query.slice(0, 120) : ""} />
    </main>
  );
}
