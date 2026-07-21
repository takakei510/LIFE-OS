"use client";

export default function QuestsError({ reset }: { reset: () => void }) {
  return (
    <main>
      <section className="emptyState">
        <p className="eyebrow">QUEST BOARD ERROR</p>
        <h1>クエストを読み込めませんでした。</h1>
        <p className="muted">Notion接続を確認してから、もう一度試してください。</p>
        <button className="filterChip filterChipActive" onClick={reset} type="button">
          RETRY
        </button>
      </section>
    </main>
  );
}
