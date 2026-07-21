"use client";

import { useMemo, useState } from "react";
import type { Quest } from "@/lib/notion/types";

const ALL = "すべて";
const AVAILABLE = "挑戦可能";
const ACCEPTED = "進行中";
const COMPLETED = "完了";
const typeOrder = ["Daily", "Weekly", "Monthly", "Event"];

function stateKey(state: string | null): string {
  const normalized = state?.toLowerCase() ?? "";
  if (normalized.includes("complete") || normalized.includes("完了")) return COMPLETED;
  if (normalized.includes("accept") || normalized.includes("進行") || normalized.includes("受注")) return ACCEPTED;
  return AVAILABLE;
}

export function QuestBoard({ quests, source }: { quests: Quest[]; source: "notion" | "fallback" }) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState(ALL);
  const [state, setState] = useState(ALL);

  const questTypes = useMemo(() => Array.from(
    new Set(quests.map((quest) => quest.questType).filter((value): value is string => Boolean(value))),
  ).sort((a, b) => {
    const ai = typeOrder.indexOf(a);
    const bi = typeOrder.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  }), [quests]);

  const visibleQuests = useMemo(() => quests.filter((quest) => {
    const normalizedQuery = query.trim().toLocaleLowerCase("ja");
    const searchableText = [
      quest.name,
      quest.description,
      quest.completionCondition,
      quest.category,
      quest.questType,
      quest.state,
      `${quest.rewardXp} XP`,
    ].filter(Boolean).join(" ").toLocaleLowerCase("ja");

    if (normalizedQuery && !searchableText.includes(normalizedQuery)) return false;
    if (type !== ALL && quest.questType !== type) return false;
    if (state !== ALL && stateKey(quest.state) !== state) return false;
    return true;
  }), [quests, query, type, state]);

  return (
    <>
      <section className="filterPanel" aria-label="クエスト検索と絞り込み">
        <label style={{ display: "grid", gap: 8, color: "var(--muted)", fontSize: ".78rem", fontWeight: 700 }}>
          クエストを検索
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="名前・説明・達成条件・報酬から検索"
            aria-label="クエストを検索"
            style={{ width: "100%", padding: 13, border: "1px solid var(--line)", borderRadius: 12, background: "var(--panel)", color: "var(--text)", font: "inherit" }}
          />
        </label>

        <label style={{ display: "grid", gap: 8, color: "var(--muted)", fontSize: ".78rem", fontWeight: 700 }}>
          種類
          <select value={type} onChange={(event) => setType(event.target.value)} style={{ width: "100%", padding: 12, border: "1px solid var(--line)", borderRadius: 12, background: "var(--panel)", color: "var(--text)" }}>
            {[ALL, ...questTypes].map((value) => <option key={value}>{value}</option>)}
          </select>
        </label>

        <label style={{ display: "grid", gap: 8, color: "var(--muted)", fontSize: ".78rem", fontWeight: 700 }}>
          状態
          <select value={state} onChange={(event) => setState(event.target.value)} style={{ width: "100%", padding: 12, border: "1px solid var(--line)", borderRadius: 12, background: "var(--panel)", color: "var(--text)" }}>
            {[ALL, AVAILABLE, ACCEPTED, COMPLETED].map((value) => <option key={value}>{value}</option>)}
          </select>
        </label>
      </section>

      <section className="questSummary" aria-label="クエスト件数">
        <span>{visibleQuests.length} / {quests.length} クエスト</span>
        <span className={`sourceBadge sourceBadge--${source}`}>
          {source === "notion" ? "NOTION同期中" : "デモ表示"}
        </span>
      </section>

      {visibleQuests.length === 0 ? (
        <section className="emptyState">
          <p className="eyebrow">NO QUEST FOUND</p>
          <h2>条件に合う冒険が見つかりません。</h2>
          <p className="muted">検索語や絞り込み条件を変えてみてください。</p>
        </section>
      ) : (
        <section className="questGrid">
          {visibleQuests.map((quest) => {
            const stateText = stateKey(quest.state);
            const stateClass = stateText === COMPLETED ? "completed" : stateText === ACCEPTED ? "accepted" : "available";
            return (
              <article className={`questCard questCard--${stateClass}`} key={quest.id}>
                <div className="questCardTop">
                  <span className="questType">{quest.questType ?? "Free"}</span>
                  <span className="questState">{stateText}</span>
                </div>
                <div>
                  <p className="eyebrow">{quest.category ?? "🌍 WORLD"}</p>
                  <h2>{quest.name || "名前未設定のクエスト"}</h2>
                  <p className="muted">{quest.description || "新しい体験へ向かうクエストです。"}</p>
                </div>
                <div className="questReward">
                  <span>{quest.completionCondition || "達成条件はNotionで設定します"}</span>
                  <strong>+{quest.rewardXp} XP</strong>
                </div>
                <a href={quest.url} target="_blank" rel="noreferrer">Notionの記録を開く ↗</a>
              </article>
            );
          })}
        </section>
      )}
    </>
  );
}
