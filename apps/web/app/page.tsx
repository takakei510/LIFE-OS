const stats = [
  { label: "Achievements", value: "61" },
  { label: "Titles", value: "0" },
  { label: "Quests", value: "0" },
];

export default function HomePage() {
  return (
    <main>
      <section className="hero">
        <p className="eyebrow">LIFE OS · VERSION 0</p>
        <h1>世界に触れた記録を、ゲームにする。</h1>
        <p className="lead">
          LIFE OSは「何者になるか」を競うゲームではない。どれだけ世界に触れたかを楽しむゲームである。
        </p>
      </section>

      <section className="playerCard" aria-label="Player card">
        <div>
          <p className="eyebrow">PLAYER CARD</p>
          <h2>Lv. 1 Explorer</h2>
          <p className="muted">Notionとの接続後、XP・称号・進行状況を表示します。</p>
        </div>
        <div className="progressTrack" aria-label="Level progress">
          <span className="progressValue" />
        </div>
      </section>

      <section className="statsGrid">
        {stats.map((stat) => (
          <article className="statCard" key={stat.label}>
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
          </article>
        ))}
      </section>

      <section className="panel">
        <p className="eyebrow">NEXT MILESTONE</p>
        <h2>Notion Read Integration</h2>
        <p className="muted">
          Achievements、Titles、Quests、Statusをサーバー側から読み込み、実データのゲーム画面へ置き換えます。
        </p>
      </section>
    </main>
  );
}
