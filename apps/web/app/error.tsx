"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("LIFE OS page error", error);
  }, [error]);

  return (
    <main style={{ display: "grid", minHeight: "100vh", placeItems: "center", paddingBottom: 120 }}>
      <section className="panel" role="alert" style={{ width: "min(680px, 100%)", padding: 40 }}>
        <div aria-hidden="true" style={{ marginBottom: 22, fontSize: "3rem" }}>🛰️</div>
        <p className="eyebrow">SYNC INTERRUPTED</p>
        <h1 style={{ fontSize: "clamp(2.2rem, 7vw, 4.4rem)" }}>世界の記録を読み込めませんでした。</h1>
        <p className="lead">
          Notionとの通信が一時的に途切れた可能性があります。記録そのものが消えたわけではありません。
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 30 }}>
          <button
            type="button"
            onClick={reset}
            style={{ padding: "12px 16px", border: "1px solid var(--accent)", borderRadius: 999, background: "rgba(143, 167, 255, .13)", color: "var(--text)", font: "inherit", fontWeight: 800, cursor: "pointer" }}
          >
            もう一度読み込む
          </button>
          <Link className="notionLink" href="/" style={{ marginTop: 0, padding: "12px 16px" }}>HOMEへ戻る</Link>
        </div>

        {error.digest ? <p className="muted" style={{ marginTop: 28, fontSize: ".72rem" }}>エラー識別子: {error.digest}</p> : null}
      </section>
    </main>
  );
}
