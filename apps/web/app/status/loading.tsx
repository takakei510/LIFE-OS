export default function StatusLoading() {
  return (
    <main>
      <section className="pageHeader compactHero">
        <p className="eyebrow">PLAYER STATUS</p>
        <h1>現在地を読み込み中…</h1>
        <p className="lead">Notionから冒険の記録を集めています。</p>
      </section>
      <section className="statusHero emptyState">STATUS DATA LOADING</section>
    </main>
  );
}
