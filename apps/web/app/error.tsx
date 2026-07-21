"use client";

import Link from "next/link";
import { useEffect } from "react";
import "./error.css";

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
    <main className="errorPage">
      <section className="errorCard" role="alert">
        <div className="errorIcon" aria-hidden="true">🛰️</div>
        <p className="eyebrow">SYNC INTERRUPTED</p>
        <h1>世界の記録を読み込めませんでした。</h1>
        <p className="errorLead">
          Notionとの通信が一時的に途切れた可能性があります。記録そのものが消えたわけではありません。
        </p>

        <div className="errorActions">
          <button type="button" onClick={reset}>もう一度読み込む</button>
          <Link href="/">HOMEへ戻る</Link>
        </div>

        {error.digest ? <p className="errorCode">エラー識別子: {error.digest}</p> : null}
      </section>
    </main>
  );
}
