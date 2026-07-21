import Link from "next/link";

import { getLifeOsSnapshot } from "@/lib/notion/snapshot";

const typeOrder = ["Daily", "Weekly", "Monthly", "Event"];

function stateLabel(state: string | null) {
  const normalized = state?.toLowerCase() ?? "";
  if (normalized.includes("complete") || normalized.includes("完了")) return "COMPLETED";
  if (normalized.includes("accept") || normalized.includes("進行") || normalized.includes("受注")) return "ACCEPTED";
  return "AVAILABLE";
}

export default async function QuestsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; state?: string }>;
}) {
  const params = await searchParams;
  const snapshot = await getLifeOsSnapshot();
  const selectedType = params.type ?? "All";
  const selectedState = params.state ?? "All";

  const questTypes = Array.from(
    new Set(snapshot.quests.map((quest) => quest.questType).filter((value): value is string => Boolean(value))),
  ).sort((a, b) => {
    const ai = typeOrder.indexOf(a);
    const bi = typeOrder.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  const visibleQuests = snapshot.quests.filter((quest) => {
    const matchesType = selectedType === "All" || quest.questType === selectedType;
    const matchesState = selectedState === "All" || stateLabel(quest.state) === selectedState;
    return matchesType && matchesState;
  });

  return (
    <main>
      <nav className="pageNav" aria-label="Primary navigation">
        <Link href="/">HOME</Link>
        <Link href="/achievements">ACHIEVEMENTS</Link>
        <Link className="pageNavActive" href="/quests">QUESTS</Link>
      </nav>

      <section className="hero compactHero">
        <p className="eyebrow">QUEST BOARD</p>
        <h1>次の冒険を選ぶ。</h1>
        <p className="lead">やるべきことではなく、世界に触れるきっかけを並べる場所です。</p>
      </section>

      <section className="filterPanel" aria-label="Quest filters">
        <div>
          <span className="filterLabel">TYPE</span>
          <div className="filterLinks">
            {["All", ...questTypes].map((type) => (
              <Link
                className={selectedType === type ? "filterChip filterChipActive" : "filterChip"}
                href={{ pathname: "/quests", query: { type, state: selectedState } }}
                key={type}
              >
                {type}
              </Link>
            ))}
          </div>
        </div>
        <div>
          <span className="filterLabel">STATE</span>
          <div className="filterLinks">
            {["All", "AVAILABLE", "ACCEPTED", "COMPLETED"].map((state) => (
              <Link
                className={selectedState === state ? "filterChip filterChipActive" : "filterChip"}
                href={{ pathname: "/quests", query: { type: selectedType, state } }}
                key={state}
              >
                {state}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="questSummary" aria-label="Quest summary">
        <span>{visibleQuests.length} QUESTS</span>
        <span className={`sourceBadge sourceBadge--${snapshot.source}`}>
          {snapshot.source === "notion" ? "NOTION SYNC" : "DEMO MODE"}
        </span>
      </section>

      {visibleQuests.length === 0 ? (
        <section className="emptyState">
          <p className="eyebrow">NO QUESTS YET</p>
          <h2>冒険の掲示板は準備中です。</h2>
          <p className="muted">Notionでクエストを追加すると、ここに自動表示されます。</p>
        </section>
      ) : (
        <section className="questGrid">
          {visibleQuests.map((quest) => {
            const label = stateLabel(quest.state);
            return (
              <article className={`questCard questCard--${label.toLowerCase()}`} key={quest.id}>
                <div className="questCardTop">
                  <span className="questType">{quest.questType ?? "Free"}</span>
                  <span className="questState">{label}</span>
                </div>
                <div>
                  <p className="eyebrow">{quest.category ?? "🌍 WORLD"}</p>
                  <h2>{quest.name || "Unnamed Quest"}</h2>
                  <p className="muted">{quest.description || "新しい体験へ向かうクエストです。"}</p>
                </div>
                <div className="questReward">
                  <span>{quest.completionCondition || "達成条件はNotionで設定します"}</span>
                  <strong>+{quest.rewardXp} XP</strong>
                </div>
                <a href={quest.url} target="_blank" rel="noreferrer">
                  OPEN IN NOTION ↗
                </a>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}
