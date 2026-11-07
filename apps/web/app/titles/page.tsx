

import { NeoIcon } from "@/components/ui/neo-icon";
import { TierName } from "@/components/life-icons/life-icon";
import { TitleCollection } from "./title-collection";
import { getLifeOsSnapshot } from "@/lib/notion/snapshot";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Titles | LIFE OS",
  description: "これまでの体験が形になった称号コレクション。",
};

export default async function TitlesPage() {
  const snapshot = await getLifeOsSnapshot();
  const equipped = snapshot.titles.find((title) => title.equipped);

  return (
    <main>
      <header className="pageHeader compactHero">
        <p className="eyebrow">TITLE COLLECTION</p>
        <h1>触れてきた世界の呼び名</h1>
        <p className="lead">称号は優劣ではなく、体験の積み重ねが残した足跡です。</p>
      </header>

      {equipped ? (
        <section className="equippedTitleCard" aria-label="装備中の称号">
          <span>装備中</span>
          <div>
            <p className="eyebrow"><NeoIcon name="title" size={16}/> CURRENT TITLE</p>
            <h2>{equipped.name}</h2>
            <p>{equipped.description || "この称号が、いまの冒険を彩っています。"}</p>
          </div>
          <strong><TierName tier={equipped.tier}/></strong>
        </section>
      ) : null}

      <TitleCollection
        titles={snapshot.titles}
        source={snapshot.source}
        equipmentEnabled={snapshot.source === "notion" && Boolean(process.env.BLOB_READ_WRITE_TOKEN)}
      />
    </main>
  );
}
