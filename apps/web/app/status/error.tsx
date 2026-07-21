"use client";

export default function StatusError({ reset }: { reset: () => void }) {
  return (
    <main>
      <section className="pageHeader compactHero">
        <p className="eyebrow">PLAYER STATUS</p>
        <h1>現在地を読み込めませんでした</h1>
        <p className="lead">Notionとの接続を確認して、もう一度試してください。</p>
      </section>
      <button className="filterChip filterChipActive" onClick={reset} type="button">
        RETRY
      </button>
    </main>
  );
}
