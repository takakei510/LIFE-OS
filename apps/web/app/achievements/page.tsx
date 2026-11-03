import Link from "next/link";
import { AchievementLibrary } from "./achievement-library";
import { getLifeOsSnapshot } from "@/lib/notion/snapshot";

export default async function AchievementsPage() {
  const snapshot = await getLifeOsSnapshot();
  const visible = snapshot.achievements.filter(
    (achievement) => achievement.visibility !== "Hidden" || achievement.unlocked,
  );

  return (
    <main>
      <header className="pageHeader">
        <p className="eyebrow">実績ライブラリ</p>
        <h1>世界に触れた記録</h1>
        <p className="lead">上手さではなく、初めて・挑戦・発見を集める実績図鑑。</p>
      </header>
      <nav className="pageNav" aria-label="実績を探す"><Link href="/guide">気分から探す · 探索案内人 →</Link></nav>
      <AchievementLibrary achievements={visible} source={snapshot.source} />
    </main>
  );
}
