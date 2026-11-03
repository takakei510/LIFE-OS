"use client";
import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import type { GuideInput, GuideResult } from "@/lib/life-os/guide/catalog";
import styles from "./guide.module.css";
const examples = ["今日は疲れ気味。家で静かに、小さな発見を楽しみたい。", "外に出て気分を変えたい。自然や街の知らない一面を見てみたい。", "少しずつ何かを身につけたい。音楽や創作に興味がある。"];
export function AdventureGuide({ enabled }: { enabled: boolean }) {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const inFlight = useRef(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<GuideResult | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (inFlight.current) return;
    const form = new FormData(event.currentTarget);
    const input = { message, minutes: form.get("minutes") ? Number(form.get("minutes")) : null, environment: form.get("environment"), budget: form.get("budget"), people: form.get("people"), energy: form.get("energy"), kind: form.get("kind") } as GuideInput;
    inFlight.current = true; setPending(true); setError(""); setResult(null);
    try {
      const response = await fetch("/api/guide", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input), signal: AbortSignal.timeout(55000) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "候補を選べませんでした。");
      setResult(data);
    } catch (e) { setError(e instanceof Error && e.name !== "TimeoutError" ? e.message : "返事に時間がかかっています。少し待って、もう一度お試しください。"); }
    finally { inFlight.current = false; setPending(false); }
  }
  return <>
    <section className={styles.formPanel} aria-label="探索の相談">
      {!enabled && <p className={styles.notice} role="status">案内人は準備中です。AIの無料利用設定を確認してから相談を開始します。</p>}
      <form onSubmit={submit}>
        <label className={styles.label} htmlFor="guide-message">今の気分や、やってみたいこと</label>
        <textarea id="guide-message" value={message} onChange={e => setMessage(e.target.value)} placeholder="例：雨なので家で、30分くらい。お金を使わず何か作ってみたい。" maxLength={600} rows={4} required disabled={pending} aria-describedby="guide-privacy" />
        <div className={styles.examples}>{examples.map(text => <button key={text} type="button" disabled={pending} onClick={() => { setMessage(text); setResult(null); }}>{text}</button>)}</div>
        <fieldset disabled={pending} className={styles.constraints}><legend>取り組める条件 <span>（分かるものだけ）</span></legend>
          <label>時間<select aria-label="時間" name="minutes" defaultValue=""><option value="">こだわらない</option><option value="5">5分以内</option><option value="15">15分以内</option><option value="30">30分以内</option><option value="60">1時間以内</option><option value="120">2時間以内</option><option value="240">半日以内</option></select></label>
          <label>場所<select aria-label="場所" name="environment" defaultValue="any"><option value="any">どこでも</option><option value="home">家・室内で</option><option value="outdoor">屋外で</option></select></label>
          <label>費用<select aria-label="費用" name="budget" defaultValue="any"><option value="any">こだわらない</option><option value="free">追加の出費なし</option></select></label>
          <label>人数<select aria-label="人数" name="people" defaultValue="any"><option value="any">どちらでも</option><option value="solo">一人でできる</option></select></label>
          <label>気力<select aria-label="気力" name="energy" defaultValue="any"><option value="any">こだわらない</option><option value="low">軽めがいい</option></select></label>
          <label>探すもの<select aria-label="探すもの" name="kind" defaultValue="any"><option value="any">実績もクエストも</option><option value="achievement">実績</option><option value="quest">クエスト</option></select></label>
        </fieldset>
        <p id="guide-privacy" className={styles.privacy}>相談文と候補の説明・条件を、Vercel AI Gateway経由でAI提供元へ送ります。このアプリには会話を保存せず、冒険ログ・写真は送りません。住所や秘密情報は入力しないでください。</p>
        <button className={styles.submit} type="submit" disabled={!enabled || pending || !message.trim()}>{pending ? "今のあなたに合う入口を探しています…" : "案内人に相談する →"}</button>
        <p className={styles.hint}>登録済みの候補から提案します。取り組まない日も、途中でやめる日も自由です。</p>
      </form>
    </section>
    <div role="status" aria-live="polite" className={styles.reply}>{pending ? "候補と条件を確かめています。少しお待ちください。" : ""}</div>
    {error && <p role="alert" className={styles.error}>{error}</p>}
    {result && <section className={styles.results} aria-label="案内人からの提案"><h2>こんな入口はどうでしょう。</h2><p className={styles.message}>{result.message}</p><div className={styles.cards}>{result.picks.map(({candidate:c,reason,firstStep}) => <article key={c.id} className={styles.card}>
      <div className={styles.tags}><span>{c.kind === "achievement" ? "実績" : "クエスト"}</span>{c.axis && <span>{c.axis}</span>}<span>{c.category}</span></div>
      <h3>{c.name}</h3><p>{reason}</p>
      <div className={styles.step}><strong>最初の一歩</strong><p>{firstStep}</p></div>
      <dl><div><dt>{c.longTerm ? "今回の取り組み" : "時間の目安"}</dt><dd>{c.time || "未設定"}</dd></div><div><dt>費用</dt><dd>{c.cost || "未設定・事前に確認"}</dd></div><div><dt>場所・環境</dt><dd>{c.environment || "事前に確認"}</dd></div>{c.needs && <div><dt>必要なもの</dt><dd>{c.needs}</dd></div>}</dl>
      <details><summary>{c.kind === "achievement" ? "解除条件を確認" : "完了条件を確認"}</summary><p>{c.condition}</p></details>
      <Link className={styles.open} href={c.kind === "achievement" ? `/achievements/${c.id}` : `/quests?q=${encodeURIComponent(c.name)}`}>候補を見に行く →</Link>
    </article>)}</div><p className={styles.hint}>別の気分や条件でも探せます。提案だけで解除・受注されることはありません。</p></section>}
  </>;
}
