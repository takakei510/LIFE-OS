import Link from "next/link";

import { getLifeOsSnapshot } from "@/lib/notion/snapshot";
import "./adventure-logs.css";

function formatDate(value: string | null): string {
  if (!value) return "日付未記録";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

function logIcon(logTypes: string[]): string {
  if (logTypes.includes("Photo")) return "📸";
  if (logTypes.includes("Audio")) return "🎤";
  if (logTypes.includes("Text")) return "📝";
  if (logTypes.includes("Place")) return "📍";
  return "✨";
}

export default async function AdventureLogsPage() {
  const snapshot = await getLifeOsSnapshot();
  const logs = snapshot.adventureLogs;

  return (
    <main>
      <nav className="pageNav" aria-label="Primary navigation">
        <Link href="/">HOME</Link>
        <Link href="/achievements">ACHIEVEMENTS</Link>
        <Link href="/quests">QUESTS</Link>
        <Link href="/titles">TITLES</Link>
        <Link href="/status">STATUS</Link>
      </nav>

      <section className="adventureLogsHero">
        <p className="eyebrow">ADVENTURE LOGS</p>
        <h1>現実から持ち帰った、小さな思い出。</h1>
        <p>
          写真、音、一言、場所。残したいものだけを、冒険のあとにそっと保存します。
        </p>
      </section>

      <section className="adventureLogsSummary" aria-label="Adventure Logs summary">
        <div>
          <span>記録された冒険</span>
          <strong>{logs.length}</strong>
        </div>
        <div>
          <span>写真のある記録</span>
          <strong>{logs.filter((log) => log.logTypes.includes("Photo")).length}</strong>
        </div>
        <div>
          <span>音のある記録</span>
          <strong>{logs.filter((log) => log.logTypes.includes("Audio")).length}</strong>
        </div>
      </section>

      {logs.length > 0 ? (
        <section className="adventureLogsGrid" aria-label="Adventure Logs">
          {logs.map((log) => (
            <a className="adventureLogCard" href={log.url} key={log.id} target="_blank" rel="noreferrer">
              <div className="adventureLogCardTop">
                <span className="adventureLogIcon" aria-hidden="true">{logIcon(log.logTypes)}</span>
                <div>
                  <p>{log.logTypes.join(" · ") || "Memory"}</p>
                  <h2>{log.name}</h2>
                </div>
                {log.favorite ? <span className="adventureLogFavorite" aria-label="Favorite">★</span> : null}
              </div>

              {log.memo ? <p className="adventureLogMemo">{log.memo}</p> : null}

              <dl className="adventureLogMeta">
                <div>
                  <dt>日時</dt>
                  <dd>{formatDate(log.loggedAt)}</dd>
                </div>
                {log.location ? (
                  <div>
                    <dt>場所</dt>
                    <dd>{log.location}</dd>
                  </div>
                ) : null}
                <div>
                  <dt>メディア</dt>
                  <dd>{log.media.length}件</dd>
                </div>
              </dl>
            </a>
          ))}
        </section>
      ) : (
        <section className="adventureLogsEmpty">
          <span aria-hidden="true">📭</span>
          <h2>まだ冒険ログはありません</h2>
          <p>実績解除やクエスト完了のあと、残したい瞬間だけ記録できます。</p>
          <Link href="/achievements">次の冒険を探す →</Link>
        </section>
      )}
    </main>
  );
}
