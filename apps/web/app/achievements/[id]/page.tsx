import Link from "next/link";
import { notFound } from "next/navigation";
import { getLifeOsSnapshot } from "@/lib/notion/snapshot";

export default async function AchievementDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const snapshot = await getLifeOsSnapshot();
  const achievement = snapshot.achievements.find((item) => item.id === id);

  if (!achievement || (achievement.visibility === "Hidden" && !achievement.unlocked)) notFound();

  return (
    <main>
      <Link className="backLink" href="/achievements">← Achievement Library</Link>
      <article className="achievementDetail">
        <div className="detailTopline"><span>{achievement.category ?? "未分類"}</span><span>{achievement.tier ?? "Tier未設定"}</span></div>
        <p className="eyebrow">{achievement.unlocked ? "ACHIEVEMENT UNLOCKED" : "UNDISCOVERED"}</p>
        <h1>{achievement.name}</h1>
        <blockquote>{achievement.flavorText || "世界のどこかに、まだ触れていない景色がある。"}</blockquote>
        <section className="detailSection"><h2>Challenge</h2><p>{achievement.requirement || "達成条件未設定"}</p></section>
        <section className="detailFacts">
          <div><span>XP</span><strong>{achievement.xp}</strong></div>
          <div><span>Domain</span><strong>{achievement.domains.join(" / ") || "未設定"}</strong></div>
          <div><span>Unlocked At</span><strong>{achievement.unlockedAt ?? "—"}</strong></div>
        </section>
        <a className="notionLink" href={achievement.url} target="_blank" rel="noreferrer">Notionの記録を開く ↗</a>
      </article>
    </main>
  );
}
