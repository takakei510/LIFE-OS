import { randomUUID } from "node:crypto";
import Link from "next/link";

import { AdventureLogForm } from "./adventure-log-form";
import "./new-adventure-log.css";

export default async function NewAdventureLogPage({
  searchParams,
}: {
  searchParams: Promise<{ achievementId?: string; achievementName?: string; loggedAt?: string }>;
}) {
  const query = await searchParams;
  return (
    <main>
      <nav className="pageNav" aria-label="Primary navigation">
        <Link href="/">HOME</Link><Link href="/achievements">ACHIEVEMENTS</Link><Link href="/quests">QUESTS</Link><Link href="/titles">TITLES</Link><Link href="/adventure-logs">ADVENTURE LOGS</Link><Link href="/status">STATUS</Link>
      </nav>
      <section className="newAdventureLogHero">
        <p className="eyebrow">NEW ADVENTURE LOG</p>
        <h1>この冒険から、何を持ち帰る？</h1>
        <p>{query.achievementName ? `「${query.achievementName}」の思い出を任意で残せます。` : "証拠ではありません。残したいものだけを保存できます。"}</p>
      </section>
      <AdventureLogForm requestId={randomUUID()} relatedAchievementId={query.achievementId} achievementName={query.achievementName} initialLoggedAt={query.loggedAt} />
    </main>
  );
}
