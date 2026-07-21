"use client";

import { useMemo, useState } from "react";
import type { Title } from "@/lib/notion/types";

const ALL = "すべて";
const EQUIPPED = "装備中";
const UNLOCKED = "取得済み";
const LOCKED = "未取得";
const tierOrder = ["Common", "Uncommon", "Rare", "Epic", "Legendary"];

export function TitleCollection({ titles, source }: { titles: Title[]; source: "notion" | "fallback" }) {
  const [query, setQuery] = useState("");
  const [state, setState] = useState(ALL);
  const [tier, setTier] = useState(ALL);

  const tiers = useMemo(() => Array.from(new Set(titles.map((title) => title.tier).filter((value): value is string => Boolean(value)))).sort((a, b) => {
    const ai = tierOrder.indexOf(a);
    const bi = tierOrder.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  }), [titles]);

  const filtered = useMemo(() => titles.filter((title) => {
    const normalizedQuery = query.trim().toLocaleLowerCase("ja");
    const searchableText = [title.name, title.description, title.tier].filter(Boolean).join(" ").toLocaleLowerCase("ja");
    if (normalizedQuery && !searchableText.includes(normalizedQuery)) return false;
    if (state === EQUIPPED && !title.equipped) return false;
    if (state === UNLOCKED && (!title.unlocked || title.equipped)) return false;
    if (state === LOCKED && title.unlocked) return false;
    if (tier !== ALL && title.tier !== tier) return false;
    return true;
  }).sort((a, b) => {
    if (a.equipped !== b.equipped) return a.equipped ? -1 : 1;
    if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1;
    return tierOrder.indexOf(a.tier ?? "") - tierOrder.indexOf(b.tier ?? "");
  }), [titles, query, state, tier]);

  return (
    <>
      <section className="filterPanel" aria-label="称号検索と絞り込み">
        <label style={{ display: "grid", gap: 8, color: "var(--muted)", fontSize: ".78rem", fontWeight: 700 }}>
          称号を検索
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="称号名・説明・Tierから検索" aria-label="称号を検索" style={{ width: "100%", padding: 13, border: "1px solid var(--line)", borderRadius: 12, background: "var(--panel)", color: "var(--text)", font: "inherit" }} />
        </label>
        <label style={{ display: "grid", gap: 8, color: "var(--muted)", fontSize: ".78rem", fontWeight: 700 }}>
          取得状態
          <select value={state} onChange={(event) => setState(event.target.value)} style={{ width: "100%", padding: 12, border: "1px solid var(--line)", borderRadius: 12, background: "var(--panel)", color: "var(--text)" }}>
            {[ALL, EQUIPPED, UNLOCKED, LOCKED].map((value) => <option key={value}>{value}</option>)}
          </select>
        </label>
        <label style={{ display: "grid", gap: 8, color: "var(--muted)", fontSize: ".78rem", fontWeight: 700 }}>
          Tier
          <select value={tier} onChange={(event) => setTier(event.target.value)} style={{ width: "100%", padding: 12, border: "1px solid var(--line)", borderRadius: 12, background: "var(--panel)", color: "var(--text)" }}>
            {[ALL, ...tiers].map((value) => <option key={value}>{value}</option>)}
          </select>
        </label>
      </section>

      <div className="titleSummary"><span>{filtered.length} / {titles.length} 称号</span><span>{source === "notion" ? "NOTION同期中" : "デモ表示"}</span></div>

      {filtered.length ? (
        <section className="titleGrid" aria-label="称号コレクション">
          {filtered.map((title) => (
            <article className={`titleCard ${title.equipped ? "titleCard--equipped" : title.unlocked ? "titleCard--unlocked" : "titleCard--locked"}`} key={title.id}>
              <div className="titleCardTop"><span>{title.equipped ? "👑 装備中" : title.unlocked ? "取得済み" : "未取得"}</span><strong>{title.tier ?? "Tier未設定"}</strong></div>
              <div><h2>{title.unlocked ? title.name : "未発見の称号"}</h2><p>{title.unlocked ? (title.description || "体験の積み重ねから生まれた称号。") : "まだ名前のない物語が、次の体験を待っています。"}</p></div>
              {title.unlocked ? <a href={title.url} target="_blank" rel="noreferrer">Notionの記録を開く →</a> : <span className="lockedHint">実績を重ねることで解除</span>}
            </article>
          ))}
        </section>
      ) : (
        <section className="panel emptyState"><p className="eyebrow">NO TITLE FOUND</p><h2>条件に合う称号が見つかりません。</h2><p className="muted">検索語や絞り込み条件を変えてみてください。</p></section>
      )}
    </>
  );
}
