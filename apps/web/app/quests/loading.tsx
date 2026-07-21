export default function QuestsLoading() {
  return (
    <main>
      <section className="hero compactHero">
        <p className="eyebrow">QUEST BOARD</p>
        <h1>冒険を読み込み中…</h1>
        <p className="lead">Notionからクエストを取得しています。</p>
      </section>
      <section className="emptyState" aria-live="polite">
        <p className="muted">世界への入口を準備しています。</p>
      </section>
    </main>
  );
}
