import Link from "next/link";
import { AchievementLibrary } from "./achievement-library";
import "./tree/tree.css";
import { getLifeOsSnapshot } from "@/lib/notion/snapshot";

export default async function AchievementsPage({ searchParams }: { searchParams: Promise<{ category?: string | string[] }> }) {
  const snapshot = await getLifeOsSnapshot();
  const visible = snapshot.achievements.filter(
    (achievement) => achievement.visibility !== "Hidden" || achievement.unlocked,
  );
  const requestedCategory = (await searchParams).category;
  const initialCategory = typeof requestedCategory === "string" && visible.some((achievement) => achievement.category === requestedCategory)
    ? requestedCategory : "すべて";

  return (
    <main>
      <header className="pageHeader">
        <p className="eyebrow">実績ライブラリ</p>
        <h1>世界に触れた記録</h1>
        <p className="lead">上手さではなく、初めて・挑戦・発見を集める実績図鑑。</p>
      </header>
      <nav className="achievementViews" aria-label="実績の表示方法"><Link href="/achievements" aria-current="page">一覧</Link><Link href={initialCategory === "すべて" ? "/achievements/tree" : `/achievements/tree?category=${encodeURIComponent(initialCategory)}`}>ツリー</Link></nav>
      <Link className="notionLink" href="/guide">気分から探す · 探索案内人 →</Link>
      <AchievementLibrary key={initialCategory} achievements={visible} source={snapshot.source} initialCategory={initialCategory}/>
    </main>
  );
}
