import Link from "next/link";

import { getLifeOsSnapshot } from "@/lib/notion/snapshot";

function clampProgress(value: number): number {
  const percent = value <= 1 ? value * 100 : value;
  return Math.min(100, Math.max(0, percent));
}

export const metadata = {
  title: "Status | LIFE OS",
  description: "LIFE OSの現在地を確認するStatus画面",
};

export default async function StatusPage() {
  const snapshot = await getLifeOsSnapshot();
  const player = snapshot.player;
  const equippedTitle = snapshot.titles.find((title) => title.equipped);

  const level = player?.level ?? 1;
  const totalXp = player?.totalXp ?? 0;
  const nextLevelXp = player?.nextLevelXp ?? 100;
  const progress = clampProgress(player?.progress ?? 0);
  const rank = player?.playerRank ?? "Explorer";

  const records = [
    {
      label: "ACHIEVEMENTS",
      value: player?.unlockedAchievements ?? snapshot.achievements.filter((item) => item.unlocked).length,
      total: snapshot.achievements.length,
      href: "/achievements",
      message: "世界に触れた記録",
    },
    {
      label: "TITLES",
      value: player?.unlockedTitles ?? snapshot.titles.filter((item) => item.unlocked).length,
      total: snapshot.titles.length,
      href: "/titles",
      message: "冒険から生まれた呼び名",
    },
    {
      label: "QUESTS",
      value: player?.completedQuests ?? snapshot.quests.filter((item) => item.completedAt).length,
      total: snapshot.quests.length,
      href: "/quests",
      message: "踏み出した冒険の数",
    },
  ];

  return (
    <main>
      <nav className="pageNav" aria-label="Primary navigation">
        <Link href="/">HOME</Link>
        <Link href="/achievements">ACHIEVEMENTS</Link>
        <Link href="/quests">QUESTS</Link>
        <Link href="/titles">TITLES</Link>
        <Link className="pageNavActive" href="/status">STATUS</Link>
      </nav>

      <header className="pageHeader compactHero">
        <p className="eyebrow">PLAYER STATUS</p>
        <h1>いま立っている場所</h1>
        <p className="lead">数字は優劣ではなく、これまで世界に触れてきた足跡です。</p>
      </header>

      <section className="statusHero" aria-label="Player status overview">
        <div className="statusIdentity">
          <div>
            <span className="statusLevelLabel">LEVEL</span>
            <strong className="statusLevel">{level}</strong>
          </div>
          <div>
            <p className="eyebrow">{rank}</p>
            <h2>{equippedTitle ? `👑 ${equippedTitle.name}` : "称号未装備"}</h2>
            <p className="muted">{totalXp.toLocaleString()} XP accumulated</p>
          </div>
        </div>

        <div className="xpRow">
          <strong>{Math.round(progress)}%</strong>
          <span>次のレベルまで {Math.max(0, nextLevelXp).toLocaleString()} XP</span>
        </div>
        <div
          className="progressTrack"
          role="progressbar"
          aria-label={`Level progress ${Math.round(progress)}%`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress)}
        >
          <span className="progressValue" style={{ width: `${progress}%` }} />
        </div>

        <span className={`sourceBadge sourceBadge--${snapshot.source}`}>
          {snapshot.source === "notion" ? "NOTION SYNC" : "DEMO MODE"}
        </span>
        {snapshot.warning ? <p className="syncWarning">{snapshot.warning}</p> : null}
      </section>

      <section className="statusRecordGrid" aria-label="Life OS records">
        {records.map((record) => (
          <Link className="statusRecordCard" href={record.href} key={record.label}>
            <span>{record.label}</span>
            <strong>
              {record.value}<small> / {record.total}</small>
            </strong>
            <p>{record.message}</p>
            <b>OPEN →</b>
          </Link>
        ))}
      </section>
    </main>
  );
}
