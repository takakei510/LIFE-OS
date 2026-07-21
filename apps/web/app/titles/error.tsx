"use client";

export default function TitlesError({ reset }: { reset: () => void }) {
  return (
    <main>
      <section className="pageHeader compactHero">
        <p className="eyebrow">TITLE COLLECTION</p>
        <h1>称号を読み込めませんでした</h1>
        <p className="lead">Notionとの接続を確認して、もう一度お試しください。</p>
      </section>
      <section className="panel emptyState">
        <button className="filterChip" onClick={reset} type="button">RETRY</button>
      </section>
    </main>
  );
}
