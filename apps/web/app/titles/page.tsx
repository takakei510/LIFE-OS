import Link from "next/link";

import { getLifeOsSnapshot } from "@/lib/notion/snapshot";

const tierOrder = ["Common", "Uncommon", "Rare", "Epic", "Legendary"];

type SearchParams = Promise<{ state?: string; tier?: string }>;

export const metadata = {
  title: "Titles | LIFE OS",
  description: "これまでの体験が形になった称号コレクション。",
};

export default async function TitlesPage({ searchParams }: { searchParams: SearchParams }) {
  const snapshot = await getLifeOsSnapshot();
  const params = await searchParams;
  const state = params.state ?? "all";
  const tier = params.tier ?? "all";

  const equipped = snapshot.titles.find((title) => title.equipped);
  const filtered = snapshot.titles
    .filter((title) => {
      if (state === "equipped" && !title.equipped) return false;
      if (state === "unlocked" && (!title.unlocked || title.equipped)) return false;
      if (state === "locked" && title.unlocked) return false;
      if (tier !== "all" && title.tier !== tier) return false;
      return true;
    })
    .sort((a, b) => {
      if (a.equipped !== b.equipped) return a.equipped ? -1 : 1;
      if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1;
      return tierOrder.indexOf(a.tier ?? "") - tierOrder.indexOf(b.tier ?? "");
    });

  const makeHref = (nextState: string, nextTier: string) => {
    const query = new URLSearchParams();
    if (nextState !== "all") query.set("state", nextState);
    if (nextTier !== "all") query.set("tier", nextTier);
    return `/titles${query.size ? `?${query.toString()}` : ""}`;
  };

  return (
    <main>
      <nav className="pageNav" aria-label="Primary navigation">
        <Link href="/">HOME</Link>
        <Link href="/achievements">ACHIEVEMENTS</Link>
        <Link href="/quests">QUESTS</Link>
        <Link className="pageNavActive" href="/titles">TITLES</Link>
      </nav>

      <header className="pageHeader compactHero">
        <p className="eyebrow">TITLE COLLECTION</p>
        <h1>触れてきた世界の呼び名</h1>
        <p className="lead">称号は優劣ではなく、体験の積み重ねが残した足跡です。</p>
      </header>

      {equipped ? (
        <section className="equippedTitleCard" aria-label="Equipped title">
          <span>NOW EQUIPPED</span>
          <div>
            <p className="eyebrow">👑 CURRENT TITLE</p>
            <h2>{equipped.name}</h2>
            <p>{equipped.description || "この称号が、いまの冒険を彩っています。"}</p>
          </div>
          <strong>{equipped.tier ?? "Title"}</strong>
        </section>
      ) : null}

      <section className="filterPanel" aria-label="Title filters">
        <div>
          <span className="filterLabel">STATE</span>
          <div className="filterLinks">
            {[
              ["all", "ALL"],
              ["equipped", "EQUIPPED"],
              ["unlocked", "UNLOCKED"],
              ["locked", "LOCKED"],
            ].map(([value, label]) => (
              <Link className={`filterChip ${state === value ? "filterChipActive" : ""}`} href={makeHref(value, tier)} key={value}>{label}</Link>
            ))}
          </div>
        </div>
        <div>
          <span className="filterLabel">TIER</span>
          <div className="filterLinks">
            {["all", ...tierOrder].map((value) => (
              <Link className={`filterChip ${tier === value ? "filterChipActive" : ""}`} href={makeHref(state, value)} key={value}>{value === "all" ? "ALL" : value.toUpperCase()}</Link>
            ))}
          </div>
        </div>
      </section>

      <div className="titleSummary">
        <span>{filtered.length} TITLES</span>
        <span>{snapshot.source === "notion" ? "NOTION SYNC" : "DEMO MODE"}</span>
      </div>

      {filtered.length ? (
        <section className="titleGrid" aria-label="Title collection">
          {filtered.map((title) => (
            <article className={`titleCard ${title.equipped ? "titleCard--equipped" : title.unlocked ? "titleCard--unlocked" : "titleCard--locked"}`} key={title.id}>
              <div className="titleCardTop">
                <span>{title.equipped ? "👑 EQUIPPED" : title.unlocked ? "UNLOCKED" : "LOCKED"}</span>
                <strong>{title.tier ?? "Title"}</strong>
              </div>
              <div>
                <h2>{title.unlocked ? title.name : "未発見の称号"}</h2>
                <p>{title.unlocked ? (title.description || "体験の積み重ねから生まれた称号。") : "まだ名前のない物語が、次の体験を待っています。"}</p>
              </div>
              {title.unlocked ? <a href={title.url} target="_blank" rel="noreferrer">OPEN IN NOTION →</a> : <span className="lockedHint">実績を重ねることで解除</span>}
            </article>
          ))}
        </section>
      ) : (
        <section className="panel emptyState">条件に合う称号はまだありません。</section>
      )}
    </main>
  );
}
