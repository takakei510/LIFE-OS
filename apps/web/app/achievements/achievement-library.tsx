"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Achievement } from "@/lib/notion/types";

export function AchievementLibrary({ achievements, source }: { achievements: Achievement[]; source: "notion" | "fallback" }) {
  const [category, setCategory] = useState("All");
  const [tier, setTier] = useState("All");
  const [state, setState] = useState("All");

  const categories = ["All", ...Array.from(new Set(achievements.map((a) => a.category).filter(Boolean) as string[]))];
  const tiers = ["All", ...Array.from(new Set(achievements.map((a) => a.tier).filter(Boolean) as string[]))];

  const filtered = useMemo(() => achievements.filter((a) => {
    if (category !== "All" && a.category !== category) return false;
    if (tier !== "All" && a.tier !== tier) return false;
    if (state === "Unlocked" && !a.unlocked) return false;
    if (state === "Undiscovered" && a.unlocked) return false;
    return true;
  }), [achievements, category, tier, state]);

  return (
    <>
      <div className="libraryToolbar">
        <span className="syncBadge">{source === "notion" ? "NOTION SYNC" : "DEMO MODE"}</span>
        <strong>{filtered.length} / {achievements.length}</strong>
      </div>
      <div className="filterGrid">
        <label>Category<select value={category} onChange={(e) => setCategory(e.target.value)}>{categories.map((v) => <option key={v}>{v}</option>)}</select></label>
        <label>Tier<select value={tier} onChange={(e) => setTier(e.target.value)}>{tiers.map((v) => <option key={v}>{v}</option>)}</select></label>
        <label>State<select value={state} onChange={(e) => setState(e.target.value)}><option>All</option><option>Unlocked</option><option>Undiscovered</option></select></label>
      </div>
      <section className="achievementGrid">
        {filtered.map((achievement) => (
          <Link className={`achievementCard ${achievement.unlocked ? "isUnlocked" : "isLocked"}`} href={`/achievements/${achievement.id}`} key={achievement.id}>
            <div className="achievementMeta"><span>{achievement.category ?? "未分類"}</span><span>{achievement.tier ?? "Tier未設定"}</span></div>
            <h2>{achievement.unlocked ? achievement.name : "？？？"}</h2>
            <p>{achievement.unlocked ? achievement.flavorText : "まだ触れていない世界がある。"}</p>
            <div className="achievementFooter"><strong>{achievement.xp} XP</strong><span>{achievement.unlocked ? "UNLOCKED" : "UNDISCOVERED"}</span></div>
          </Link>
        ))}
      </section>
      {filtered.length === 0 && <p className="emptyState">条件に一致する実績はありません。</p>}
    </>
  );
}
