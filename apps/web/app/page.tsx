import Link from "next/link";

import { getLifeOsSnapshot } from "@/lib/notion/snapshot";

function clampProgress(value: number): number {
  const percent = value <= 1 ? value * 100 : value;
  return Math.min(100, Math.max(0, percent));
}

export default async function HomePage() {
  const snapshot = await getLifeOsSnapshot();
  const player = snapshot.player;
  const equippedTitle = snapshot.titles.find((title) => title.equipped);

  const level = player?.level ?? 1;
  const totalXp = player?.totalXp ?? 0;
  const nextLevelXp = player?.nextLevelXp ?? 100;
  const progress = clampProgress(player?.progress ?? 0);
  const rank = player?.playerRank ?? "Explorer";

  const stats = [
    {
      label: "Achievements",
      value: player?.unlockedAchievements ?? snapshot.achievements.filter((item) => item.unlocked).length,
      total: snapshot.achievements.length,
      href: "/achievements",
    },
    {
      label: "Titles",
      value: player?.unlockedTitles ?? snapshot.titles.filter((item) => item.unlocked).length,
      total: snapshot.titles.length,
      href: "/titles",
    },
    {
      label: "Quests",
      value: player?.completedQuests ?? snapshot.quests.filter((item) => item.completedAt).length,
      total: snapshot.quests.length,
      href: "/quests",
    },
  ];

  return (
    <main>
      <nav className="pageNav" aria-label="Primary navigation">
        <Link className="pageNavActive" href="/">HOME</Link>
        <Link href="/achievements">ACHIEVEMENTS</Link>
        <Link href="/quests">QUESTS</Link>
        <Link href="/titles">TITLES</Link>
        <Link href="/status">STATUS</Link>
      </nav>

      <section className="hero">
        <p className="eyebrow">LIFE OS · VERSION 0</p>
        <h1>世界に触れた記録を、ゲームにする。</h1>
        <p className="lead">
          LIFE OSは「何者になるか」を競うゲームではない。どれだけ世界に触れたかを楽しむゲームである。
        </p>
      </section>

      <section className="playerCard" aria-label="Player card">
        <div className="playerCardHeader">
          <div>
            <p className="eyebrow">PLAYER CARD</p>
            <h2>Lv. {level} {rank}</h2>
            <p className="playerTitle">{equippedTitle ? `👑 ${equippedTitle.name}` : "称号未装備"}</p>
          </div>
          <span className={`sourceBadge sourceBadge--${snapshot.source}`}>
            {snapshot.source === "notion" ? "NOTION SYNC" : "DEMO MODE"}
          </span>
        </div>

        <div className="xpRow">
          <strong>{totalXp.toLocaleString()} XP</strong>
          <span>次のレベルまで {Math.max(0, nextLevelXp).toLocaleString()} XP</span>
        </div>
        <div
          className="progressTrack"
          aria-label={`Level progress ${Math.round(progress)}%`}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress)}
        >
          <span className="progressValue" style={{ width: `${progress}%` }} />
        </div>

        {snapshot.warning ? <p className="syncWarning">{snapshot.warning}</p> : null}
        <Link className="notionLink" href="/status">VIEW FULL STATUS →</Link>
      </section>

      <section className="statsGrid" aria-label="Player statistics">
        {stats.map((stat) => (
          <Link className="statCard statCardLink" href={stat.href} key={stat.label}>
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
            <small>{stat.total > 0 ? `${stat.total}件中` : "データ待機中"}</small>
          </Link>
        ))}
      </section>

      <section className="panel">
        <p className="eyebrow">CURRENT POSITION</p>
        <h2>Player Status</h2>
        <p className="muted">レベルや解除記録から、いま立っている場所を眺めます。</p>
        <Link className="notionLink" href="/status">OPEN STATUS →</Link>
      </section>
    </main>
  );
}
