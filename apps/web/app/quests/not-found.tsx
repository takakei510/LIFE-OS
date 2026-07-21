import Link from "next/link";

export default function QuestsNotFound() {
  return (
    <main>
      <section className="emptyState">
        <p className="eyebrow">QUEST NOT FOUND</p>
        <h1>その冒険は見つかりませんでした。</h1>
        <Link className="notionLink" href="/quests">QUEST BOARDへ戻る →</Link>
      </section>
    </main>
  );
}
