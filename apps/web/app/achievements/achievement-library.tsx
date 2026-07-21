"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Achievement } from "@/lib/notion/types";

const ALL = "すべて";
const UNLOCKED = "解除済み";
const UNDISCOVERED = "未解除";

export function AchievementLibrary({ achievements, source }: { achievements: Achievement[]; source: "notion" | "fallback" }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(ALL);
  const [tier, setTier] = useState(ALL);
  const [state, setState] = useState(ALL);

  const categories = [ALL, ...Array.from(new Set(achievements.map((a) => a.category).filter(Boolean) as string[]))];
  const tiers = [ALL, ...Array.from(new Set(achievements.map((a) => a.tier).filter(Boolean) as string[]))];

  const filtered = useMemo(() => achievements.filter((a) => {
    const normalizedQuery = query.trim().toLocaleLowerCase("ja");
    const searchableText = [
      a.name,
      a.flavorText,
      a.requirement,
      a.category,
      a.tier,
      ...a.domains,
    ].filter(Boolean).join(" ").toLocaleLowerCase("ja");

    if (normalizedQuery && !searchableText.includes(normalizedQuery)) return false;
    if (category !== ALL && a.category !== category) return false;
    if (tier !== ALL && a.tier !== tier) return false;
    if (state === UNLOCKED && !a.unlocked) return false;
    if (state === UNDISCOVERED && a.unlocked) return false;
    return true;
  }), [achievements, query, category, tier, state]);

  return (
    <>
      <div className="libraryToolbar">
        <span className="syncBadge">{source === "notion" ? "NOTION同期中" : "デモ表示"}</span>
        <strong>{filtered.length} / {achievements.length}</strong>
      </div>
      <label style={{ display: "grid", gap: 8, marginBottom: 12, color: "var(--muted)", fontSize: ".78rem", fontWeight: 700 }}>
        実績を検索
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="名前・達成条件・分野から検索"
          aria-label="実績を検索"
          style={{ width: "100%", padding: 13, border: "1px solid var(--line)", borderRadius: 12, background: "var(--panel)", color: "var(--text)", font: "inherit" }}
        />
      </label>
      <div className="filterGrid">
        <label>カテゴリ<select value={category} onChange={(e) => setCategory(e.target.value)}>{categories.map((v) => <option key={v}>{v}</option>)}</select></label>
        <label>Tier<select value={tier} onChange={(e) => setTier(e.target.value)}>{tiers.map((v) => <option key={v}>{v}</option>)}</select></label>
        <label>解除状態<select value={state} onChange={(e) => setState(e.target.value)}><option>{ALL}</option><option>{UNLOCKED}</option><option>{UNDISCOVERED}</option></select></label>
      </div>
      <section className="achievementGrid">
        {filtered.map((achievement) => (
          <Link className={`achievementCard ${achievement.unlocked ? "isUnlocked" : "isLocked"}`} href={`/achievements/${achievement.id}`} key={achievement.id}>
            <div className="achievementMeta"><span>{achievement.category ?? "未分類"}</span><span>{achievement.tier ?? "Tier未設定"}</span></div>
            <h2>{achievement.name}</h2>
            <p>{achievement.flavorText || "まだ触れていない世界がある。"}</p>
            <div className="achievementFooter"><strong>{achievement.xp} XP</strong><span>{achievement.unlocked ? "解除済み" : "未解除"}</span></div>
          </Link>
        ))}
      </section>
      {filtered.length === 0 && <p className="emptyState">検索・絞り込み条件に一致する実績はありません。</p>}
    </>
  );
}
