export default function Loading() {
  return (
    <main className="loadingPage" aria-busy="true" aria-live="polite">
      <section className="loadingHero">
        <div className="loadingLine loadingLine--eyebrow" />
        <div className="loadingLine loadingLine--title" />
        <div className="loadingLine loadingLine--lead" />
      </section>

      <section className="loadingPanel">
        <div className="loadingPanelTop">
          <div>
            <div className="loadingLine loadingLine--small" />
            <div className="loadingLine loadingLine--medium" />
          </div>
          <div className="loadingBadge" />
        </div>
        <div className="loadingLine loadingLine--wide" />
        <div className="loadingProgress" />
      </section>

      <section className="loadingCards" aria-hidden="true">
        {Array.from({ length: 3 }).map((_, index) => (
          <div className="loadingCard" key={index}>
            <div className="loadingLine loadingLine--small" />
            <div className="loadingLine loadingLine--medium" />
            <div className="loadingLine loadingLine--wide" />
          </div>
        ))}
      </section>

      <p className="loadingMessage">世界の記録を読み込んでいます…</p>
    </main>
  );
}
