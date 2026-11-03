import Link from "next/link";
import { notFound } from "next/navigation";

import { UnlockAchievement } from "./unlock-achievement";
import { getLifeOsSnapshot } from "@/lib/notion/snapshot";

export default async function AchievementDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const snapshot = await getLifeOsSnapshot();
  const achievement = snapshot.achievements.find((item) => item.id === id);

  if (!achievement || (achievement.visibility === "Hidden" && !achievement.unlocked)) notFound();

  return (
    <main>
      <Link className="backLink" href="/achievements">← 実績ライブラリへ戻る</Link>
      <article className="achievementDetail">
        {achievement.lockedByChain ? <section className="detailSection"><h1>🔒 ？？？</h1><p>前提となる実績を解除すると、この冒険の内容が明らかになります。</p></section> : <><div className="detailTopline"><span>{achievement.category ?? "未分類"}</span><span>{achievement.tier ?? "Tier未設定"}</span></div>
        <p className="eyebrow">{achievement.unlocked ? "実績解除済み" : "未解除"}</p>
        <h1>{achievement.name}</h1>
        <blockquote>{achievement.flavorText || "世界のどこかに、まだ触れていない景色がある。"}</blockquote>
        <section className="detailSection"><h2>達成条件</h2><p>{achievement.requirement || "達成条件未設定"}</p></section>
        <section className="detailFacts">
          <div><span>XP</span><strong>{achievement.xp}</strong></div>
          <div><span>分野</span><strong>{achievement.domains.join(" / ") || "未設定"}</strong></div>
          <div><span>解除日時</span><strong>{achievement.unlockedAt ?? "—"}</strong></div>
        </section>
        {achievement.unlocked ? (
          <section className="achievementUnlockedActions">
            <p>この実績の思い出は、後からでも任意で追加できます。</p>
            <Link href={`/adventure-logs/new?achievementId=${encodeURIComponent(achievement.id)}&achievementName=${encodeURIComponent(achievement.name)}&loggedAt=${encodeURIComponent(achievement.unlockedAt ?? "")}`}>
              思い出を残す
            </Link>
          </section>
        ) : (
          <UnlockAchievement achievementId={achievement.id} achievementName={achievement.name} />
        )}
        {achievement.evidenceHeadline && achievement.evidenceNote ? <section className="detailSection" aria-label="冒険の豆知識"><p className="eyebrow">💡 冒険の豆知識</p><h2>{achievement.evidenceHeadline}</h2><p>{achievement.evidenceNote}</p>{achievement.evidenceStrength && <p>研究の根拠：{achievement.evidenceStrength === "Mixed" ? "結果は混在" : achievement.evidenceStrength === "Emerging" ? "研究途上" : "研究による支持あり"}</p>}{achievement.evidenceSource.startsWith("https://") && <a href={achievement.evidenceSource} target="_blank" rel="noopener noreferrer">出典を読む ↗</a>}</section> : null}
        <a className="notionLink" href={achievement.url} target="_blank" rel="noreferrer">Notionの記録を開く ↗</a></> }
      </article>
    </main>
  );
}
