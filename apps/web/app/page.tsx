import Link from "next/link";
import { categoryLabel } from "@/components/life-icons/presentation";
import { AchievementName, TierName, PlayerRank, LogTypeIcon, CategoryName } from "@/components/life-icons/life-icon";
import { NeoIcon } from "@/components/ui/neo-icon";
import { AdventureLogPhoto } from "./adventure-logs/adventure-log-photo";

import { AchievementUnlocked } from "./achievement-unlocked";
import "@fontsource/dela-gothic-one/400.css";
import "@fontsource/train-one/400.css";
import "./home/home.css";
import { HomeHero } from "./home/home-hero";
import { CollectionBadge } from "./home/collection-badge";
import { getCollections, isHiddenAchievement } from "./home/collections";
import { AchievementBadge } from "@/components/brand/achievement-badge";
import { StellarCompass } from "@/components/brand/stellar-compass";
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
    timeZone: "Asia/Tokyo",
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
    .filter((achievement) => !achievement.unlocked && !achievement.lockedByChain && !isHiddenAchievement(achievement.visibility))
    .sort((a, b) => dailyScore(a.id, todaySeed) - dailyScore(b.id, todaySeed))
    .slice(0, 3);

  const level = player?.level ?? 1;
  const totalXp = player?.totalXp ?? 0;
  const nextLevelXp = player?.nextLevelXp ?? 100;
  const progress = clampProgress(player?.progress ?? 0);
  const rank = player?.playerRank ?? "Explorer";

  const collections = getCollections(snapshot.achievements);
  const recentAchievements = unlockedAchievements.slice(0, 3);

  const stats = [
    { label: "Achievements", value: player?.unlockedAchievements ?? snapshot.achievements.filter((item) => item.unlocked).length, total: snapshot.achievements.length, href: "/achievements" },
    { label: "Titles", value: player?.unlockedTitles ?? snapshot.titles.filter((item) => item.unlocked).length, total: snapshot.titles.length, href: "/titles" },
    { label: "Quests", value: player?.completedQuests ?? snapshot.quests.filter((item) => item.completedAt).length, total: snapshot.quests.length, href: "/quests" },
  ];

  return (
    <main className="homePage">
      <AchievementUnlocked achievement={latestUnlocked} />

      <section className="homePlayer" aria-label="プレイヤー情報">
        <div className="homePlayerIdentity">
          <span className="homePlayerEmblem"><StellarCompass size={32}/></span>
          <div><p className="homeKicker">PLAYER</p><h2>{player?.name || "プレイヤー"}</h2><p className="homePlayerTitle">{equippedTitle?.name ?? "称号未装備"}</p></div>
        </div>
        <div className="homePlayerProgress">
          <div className="homeXpRow"><strong><small>Lv.</small> {level}</strong><span>{totalXp.toLocaleString()} XP</span></div>
          <div className="homeProgressTrack" aria-label="レベルの進み具合" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}><span style={{ width: `${progress}%` }}/></div>
          <p>次のレベルまで {Math.max(0, nextLevelXp).toLocaleString()} XP</p>
        </div>
        <Link className="homeStatusLink" href="/status"><PlayerRank rank={rank}/><NeoIcon name="arrow" size={18}/><span className="homeSrOnly">ステータスを見る</span></Link>
        {snapshot.warning ? <p className="homeSyncWarning">{snapshot.warning}</p> : null}
      </section>

      <HomeHero/>

      <section className="homeSection" aria-labelledby="collection-heading">
        <div className="homeSectionHeader"><div><p className="homeKicker">ACHIEVEMENT COLLECTION</p><h2 className="homeSectionTitle" id="collection-heading">実績コレクション</h2></div><Link href="/achievements">すべて見る <NeoIcon name="arrow" size={16}/></Link></div>
        <div className="homeCollectionGrid">
          {collections.map((collection) => (
            <Link className="homeCollection" href={collection.category ? `/achievements?category=${encodeURIComponent(collection.category)}` : "/achievements"} key={collection.category ?? "uncategorized"}>
              <CollectionBadge category={collection.category ?? "未分類"}/>
              <strong>{categoryLabel(collection.category)}</strong>
              <span><b>{collection.unlocked}</b> / {collection.total}<small>解除済み</small></span>
            </Link>
          ))}
        </div>
        {collections.length === 0 ? <p className="homeEmpty">表示できる実績はまだありません。</p> : null}
        <p className="homeCollectionNote">{snapshot.source === "notion" ? "Notionの記録から表示しています。" : "接続設定を確認するためのデモ表示です。"} 隠し実績は解除後に加わります。</p>
      </section>

      <section className="homeSection" aria-labelledby="recent-unlocked-heading">
        <div className="homeSectionHeader"><div><p className="homeKicker">RECENTLY UNLOCKED</p><h2 className="homeSectionTitle" id="recent-unlocked-heading">最近解除した実績</h2></div><Link href="/achievements">実績を見る <NeoIcon name="arrow" size={16}/></Link></div>
        {recentAchievements.length > 0 ? <div className="homeRecentList">
          {recentAchievements.map((achievement) => (
            <Link className="homeRecentItem" href={`/achievements/${achievement.id}`} key={achievement.id}>
              <AchievementBadge tier={achievement.tier} domains={achievement.domains} size={48} achievementId={achievement.id} achievementName={achievement.name}/>
              <div className="homeItemCopy"><p className="homeItemDate">{formatActivityDate(achievement.unlockedAt)}</p><h3><AchievementName achievement={achievement} size={16}/></h3><p>{achievement.requirement || achievement.flavorText || "この体験が、あなたの記録に加わりました。"}</p></div>
              <div className="homeItemMeta"><TierName tier={achievement.tier}/><strong>+{achievement.xp} XP</strong></div>
            </Link>
          ))}
        </div> : <p className="homeEmpty">解除日時のある実績が、ここに並びます。記録は自分のペースで。</p>}
      </section>

      <section className="homeSection" aria-labelledby="daily-exploration-heading">
        <div className="homeSectionHeader"><div><p className="homeKicker">DISCOVER SOMETHING NEW · {todayLabel}</p><h2 className="homeSectionTitle" id="daily-exploration-heading">次に出会う体験</h2></div><Link href="/quests">クエストへ <NeoIcon name="arrow" size={16}/></Link></div>
        <p className="homeSectionIntro">まだ触れていない世界から、今日の3つ。気になったときに、ひとつだけでも。</p>
        {dailyExplorationPicks.length > 0 ? <div className="homeDiscoveryGrid">
          {dailyExplorationPicks.map((achievement) => (
            <Link className="homeDiscovery" href={`/achievements/${achievement.id}`} key={achievement.id}>
              <div className="homeDiscoveryArt"><AchievementBadge tier={achievement.tier} domains={achievement.domains} size={64} achievementId={achievement.id} achievementName={achievement.name}/><CategoryName category={achievement.category}/></div>
              <div className="homeDiscoveryCopy"><h3><AchievementName achievement={achievement} size={16}/></h3><p>{achievement.flavorText || achievement.requirement || "まだ触れていない世界がある。"}</p><span className="homeDiscoveryLink">体験をのぞく <NeoIcon name="arrow" size={16}/></span></div>
            </Link>
          ))}
        </div> : <p className="homeEmpty">いま表示できる未解除の通常実績はありません。</p>}
      </section>

      <section className="homeSection" aria-labelledby="recent-adventure-heading">
        <div className="homeSectionHeader"><div><p className="homeKicker">ADVENTURE LOGS</p><h2 className="homeSectionTitle" id="recent-adventure-heading">最近の冒険</h2></div><Link href="/adventure-logs">すべて見る <NeoIcon name="arrow" size={16}/></Link></div>
        {recentAdventureLogs.length > 0 ? <div className="homeMemoryList">
          {recentAdventureLogs.map((log) => (
            <a className="homeMemory" href={log.url} key={log.id} target="_blank" rel="noreferrer">
              <AdventureLogPhoto media={log.media} compact/>
              <div className="homeItemCopy"><p className="homeItemDate">{formatActivityDate(log.loggedAt)} · <LogTypeIcon logTypes={log.logTypes}/> {log.logTypes.join(" · ") || "Memory"}</p><h3>{log.name}</h3><p>{log.memo || log.location || "この冒険の思い出が残されています。"}</p></div>
              <NeoIcon name="arrow" size={18}/><span className="homeSrOnly">Notionで開く（新しいタブ）</span>
            </a>
          ))}
        </div> : <p className="homeEmpty">写真・音・一言。残したくなった冒険だけが、ここに並びます。</p>}
      </section>

      <footer className="homeFooter"><span className="homeSyncState">{snapshot.source === "notion" ? "NOTION SYNC" : "DEMO MODE"}</span><div>{stats.map((stat) => <Link href={stat.href} key={stat.label}>{stat.label} <b>{stat.value}</b><span> / {stat.total}</span></Link>)}</div></footer>
    </main>
  );
}
