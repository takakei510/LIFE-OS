import Link from "next/link";

import { AchievementUnlocked } from "./achievement-unlocked";
import "./recent-achievements.css";
import { getLifeOsSnapshot } from "@/lib/notion/snapshot";

function clampProgress(value: number): number {
  const percent = value <= 1 ? value * 100 : value;
  return Math.min(100, Math.max(0, percent));
}

function formatActivityDate(value: string | null): string {
  if (!value) return "日付未記録";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function dailyScore(value: string, seed: string): number {
  const input = `${seed}:${value}`;
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function isHiddenAchievement(visibility: string | null): boolean {
  const normalized = visibility?.trim().toLowerCase() ?? "";
  return normalized.includes("hidden") || normalized.includes("secret") || normalized.includes("非公開") || normalized.includes("隠し");
}

function adventureLogIcon(logTypes: string[]): string {
  if (logTypes.includes("Photo")) return "📸";
  if (logTypes.includes("Audio")) return "🎤";
  if (logTypes.includes("Text")) return "📝";
  if (logTypes.includes("Place")) return "📍";
  return "✨";
}

export default async function HomePage() {
  const snapshot = await getLifeOsSnapshot();
  const player = snapshot.player;
  const equippedTitle = snapshot.titles.find((title) => title.equipped);
  const unlockedAchievements = snapshot.source === "notion"
    ? [...snapshot.achievements]
        .filter((achievement) => achievement.unlocked && achievement.unlockedAt)
        .sort((a, b) => Date.parse(b.unlockedAt ?? "") - Date.parse(a.unlockedAt ?? ""))
    : [];
  const latestUnlocked = unlockedAchievements[0] ?? null;
  const recentAdventureLogs = snapshot.adventureLogs.slice(0, 5);

  const todaySeed = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const todayLabel = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    month: "long",
    day: "numeric",
  }).format(new Date());
  const dailyExplorationPicks = snapshot.achievements
    .filter((achievement) => !achievement.unlocked && !isHiddenAchievement(achievement.visibility))
    .sort((a, b) => dailyScore(a.id, todaySeed) - dailyScore(b.id, todaySeed))
    .slice(0, 3);

  const level = player?.level ?? 1;
  const totalXp = player?.totalXp ?? 0;
  const nextLevelXp = player?.nextLevelXp ?? 100;
  const progress = clampProgress(player?.progress ?? 0);
  const rank = player?.playerRank ?? "Explorer";

  const stats = [
    { label: "Achievements", value: player?.unlockedAchievements ?? snapshot.achievements.filter((item) => item.unlocked).length, total: snapshot.achievements.length, href: "/achievements" },
    { label: "Titles", value: player?.unlockedTitles ?? snapshot.titles.filter((item) => item.unlocked).length, total: snapshot.titles.length, href: "/titles" },
    { label: "Quests", value: player?.completedQuests ?? snapshot.quests.filter((item) => item.completedAt).length, total: snapshot.quests.length, href: "/quests" },
  ];

  return (
    <main>
      <AchievementUnlocked achievement={latestUnlocked} />

      <nav className="pageNav" aria-label="Primary navigation">
        <Link className="pageNavActive" href="/">HOME</Link>
        <Link href="/achievements">ACHIEVEMENTS</Link>
        <Link href="/quests">QUESTS</Link>
        <Link href="/titles">TITLES</Link>
        <Link href="/status">STATUS</Link>
      </nav>

      <section className="hero">
        <p className="eyebrow">LIFE OS · VERSION 0.4</p>
        <h1>世界に触れた記録を、ゲームにする。</h1>
        <p className="lead">LIFE OSは「何者になるか」を競うゲームではない。どれだけ世界に触れたかを楽しむゲームである。</p>
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
        <div className="progressTrack" aria-label={`Level progress ${Math.round(progress)}%`} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}>
          <span className="progressValue" style={{ width: `${progress}%` }} />
        </div>
        {snapshot.warning ? <p className="syncWarning">{snapshot.warning}</p> : null}
        <Link className="notionLink" href="/status">VIEW FULL STATUS →</Link>
      </section>

      <section className="statsGrid" aria-label="Player statistics">
        {stats.map((stat) => (
          <Link className="statCard statCardLink" href={stat.href} key={stat.label}>
            <span>{stat.label}</span><strong>{stat.value}</strong><small>{stat.total > 0 ? `${stat.total}件中` : "データ待機中"}</small>
          </Link>
        ))}
      </section>

      <section className="recentAchievements" aria-labelledby="daily-exploration-heading">
        <div className="recentAchievementsHeader">
          <div><p className="eyebrow">TODAY&apos;S EXPLORATION · {todayLabel}</p><h2 id="daily-exploration-heading">今日の探索候補</h2></div>
          <Link href="/achievements">実績を探す →</Link>
        </div>
        {dailyExplorationPicks.length > 0 ? (
          <div className="recentAchievementList">
            {dailyExplorationPicks.map((achievement) => (
              <Link className="recentAchievementItem" href={`/achievements/${achievement.id}`} key={achievement.id}>
                <div><span>🧭 {achievement.category ?? "未分類"}</span><strong>{achievement.name}</strong><small>{achievement.flavorText || "まだ触れていない世界がある。"}</small></div>
                <div className="recentAchievementMeta"><span>{achievement.tier ?? "Tier未設定"}</span><b>+{achievement.xp} XP</b></div>
              </Link>
            ))}
          </div>
        ) : <p className="recentAchievementsEmpty">いま表示できる未解除の通常実績はありません。</p>}
      </section>

      <section className="recentAchievements" aria-labelledby="recent-adventure-heading">
        <div className="recentAchievementsHeader">
          <div><p className="eyebrow">ADVENTURE LOGS</p><h2 id="recent-adventure-heading">最近の冒険</h2></div>
          <Link href="/adventure-logs">すべて見る →</Link>
        </div>
        {recentAdventureLogs.length > 0 ? (
          <div className="recentAchievementList">
            {recentAdventureLogs.map((log) => (
              <a className="recentAchievementItem" href={log.url} key={log.id} target="_blank" rel="noreferrer">
                <div><span>{adventureLogIcon(log.logTypes)} {log.logTypes.join(" · ") || "Memory"}</span><strong>{log.name}</strong><small>{log.memo || log.location || "この冒険の思い出が残されています。"}</small></div>
                <div className="recentAchievementMeta"><span>{formatActivityDate(log.loggedAt)}</span><b>{log.favorite ? "★" : `${log.media.length} media`}</b></div>
              </a>
            ))}
          </div>
        ) : <p className="recentAchievementsEmpty">写真・音・一言を残した冒険が、ここに並びます。</p>}
      </section>

      <section className="panel">
        <p className="eyebrow">CURRENT POSITION</p><h2>Player Status</h2><p className="muted">レベルや解除記録から、いま立っている場所を眺めます。</p><Link className="notionLink" href="/status">OPEN STATUS →</Link>
      </section>
    </main>
  );
}
