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
  const [mode, setMode] = useState<"copy" | "builtin">("copy");
  const [consultation, setConsultation] = useState<{ text: string; count: number; eligibleCount: number } | null>(null);
  const [copyStatus, setCopyStatus] = useState("");
  const outputRef = useRef<HTMLTextAreaElement>(null);
  function clearOutput() { setConsultation(null); setCopyStatus(""); setResult(null); setError(""); }
  async function copyConsultation() {
    if (!consultation?.text) return;
    try { await navigator.clipboard.writeText(consultation.text); setCopyStatus("コピーしました。普段使っているAIの会話に貼り付けてください。"); }
    catch { outputRef.current?.focus(); outputRef.current?.select(); setCopyStatus("自動コピーが使えませんでした。下の文章を選択してコピーしてください。"); }
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (inFlight.current) return;
    const form = new FormData(event.currentTarget);
    const input = { message, minutes: form.get("minutes") ? Number(form.get("minutes")) : null, environment: form.get("environment"), budget: form.get("budget"), people: form.get("people"), energy: form.get("energy"), kind: form.get("kind") } as GuideInput;
    inFlight.current = true; setPending(true); clearOutput();
    try {
      const response = await fetch(mode === "copy" ? "/api/guide/export" : "/api/guide", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input), signal: AbortSignal.timeout(55000) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "候補を選べませんでした。");
      if (mode === "copy") setConsultation(data); else setResult(data);
    } catch (e) { setError(e instanceof Error && e.name !== "TimeoutError" ? e.message : "返事に時間がかかっています。少し待って、もう一度お試しください。"); }
    finally { inFlight.current = false; setPending(false); }
  }
  return <>
    <section className={styles.formPanel} aria-label="探索の相談">
      <div className={styles.modes} role="group" aria-label="相談方法">
        <button type="button" aria-pressed={mode === "copy"} disabled={pending} onClick={() => {setMode("copy");clearOutput();}}>いつものAIに相談</button>
        <button type="button" aria-pressed={mode === "builtin"} disabled={pending} onClick={() => {setMode("builtin");clearOutput();}}>アプリ内の案内人</button>
      </div>
      {mode === "copy" ? <p className={styles.hint}>相談用の文章をコピーして、普段使っているAIへ貼り付けられます。APIやカードの登録は不要です。</p> : !enabled && <p className={styles.notice} role="status">アプリ内の案内人は準備中です。「いつものAIに相談」は今すぐ使えます。</p>}
      <form onSubmit={submit}>
        <label className={styles.label} htmlFor="guide-message">今の気分や、やってみたいこと</label>
        <textarea id="guide-message" value={message} onChange={e => {setMessage(e.target.value);clearOutput();}} placeholder="例：雨なので家で、30分くらい。お金を使わず何か作ってみたい。" maxLength={600} rows={4} required disabled={pending} aria-describedby="guide-privacy" />
        <div className={styles.examples}>{examples.map(text => <button key={text} type="button" disabled={pending} onClick={() => { setMessage(text); clearOutput(); }}>{text}</button>)}</div>
        <fieldset disabled={pending} onChange={clearOutput} className={styles.constraints}><legend>取り組める条件 <span>（分かるものだけ）</span></legend>
          <label>時間<select aria-label="時間" name="minutes" defaultValue=""><option value="">こだわらない</option><option value="5">5分以内</option><option value="15">15分以内</option><option value="30">30分以内</option><option value="60">1時間以内</option><option value="120">2時間以内</option><option value="240">半日以内</option></select></label>
          <label>場所<select aria-label="場所" name="environment" defaultValue="any"><option value="any">どこでも</option><option value="home">家・室内で</option><option value="outdoor">屋外で</option></select></label>
          <label>費用<select aria-label="費用" name="budget" defaultValue="any"><option value="any">こだわらない</option><option value="free">追加の出費なし</option></select></label>
          <label>人数<select aria-label="人数" name="people" defaultValue="any"><option value="any">どちらでも</option><option value="solo">一人でできる</option></select></label>
          <label>気力<select aria-label="気力" name="energy" defaultValue="any"><option value="any">こだわらない</option><option value="low">軽めがいい</option></select></label>
          <label>探すもの<select aria-label="探すもの" name="kind" defaultValue="any"><option value="any">実績もクエストも</option><option value="achievement">実績</option><option value="quest">クエスト</option></select></label>
        </fieldset>
        <p id="guide-privacy" className={styles.privacy}>{mode === "copy" ? "この操作では外部AIへ送信しません。相談文と登録済み候補の情報を文章にまとめます。内容を確認し、共有してよいAIへご自身で貼り付けてください。冒険ログ・写真は含みません。" : "相談文と候補の説明・条件を、Vercel AI Gateway経由でAI提供元へ送ります。このアプリには会話を保存せず、冒険ログ・写真は送りません。住所や秘密情報は入力しないでください。"}</p>
        <button className={styles.submit} type="submit" disabled={(mode === "builtin" && !enabled) || pending || !message.trim()}>{pending ? "候補を確かめています…" : mode === "copy" ? "相談用の文章を作る →" : "案内人に相談する →"}</button>
        <p className={styles.hint}>登録済みの候補から提案します。取り組まない日も、途中でやめる日も自由です。</p>
      </form>
    </section>
    <div role="status" aria-live="polite" className={styles.reply}>{pending ? "候補と条件を確かめています。少しお待ちください。" : ""}</div>
    {error && <p role="alert" className={styles.error}>{error}</p>}
    {consultation && <section className={styles.exportPanel} aria-label="いつものAIへの相談文">
      <h2>{consultation.count ? "いつものAIへ持っていこう。" : "今の条件に合う候補がありませんでした。"}</h2>
      {consultation.count ? <><p>条件に合う{consultation.eligibleCount}件から、{consultation.count}件の候補をまとめました。内容を確認してコピーしてください。</p>
        <button type="button" className={styles.submit} onClick={copyConsultation}>相談用にコピー</button>
        <p role="status" aria-live="polite">{copyStatus}</p>
        <label className={styles.label} htmlFor="guide-export">コピーする文章（内容を確認できます）</label>
        <textarea ref={outputRef} id="guide-export" readOnly value={consultation.text} rows={12} spellCheck={false} />
        <p className={styles.hint}>AIの回答はLIFE OSへ自動では戻りません。回答内のリンクから候補を開き、実際の条件をご自身で確認できます。</p>
      </> : <p>時間や場所などの条件を少し変えて探せます。今日は見送っても大丈夫です。</p>}
    </section>}
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
