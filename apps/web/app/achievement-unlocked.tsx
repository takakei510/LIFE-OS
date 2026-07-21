"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import styles from "./achievement-unlocked.module.css";

type AchievementUnlockedProps = {
  achievement: {
    id: string;
    name: string;
    tier: string | null;
    xp: number;
    flavorText: string;
  } | null;
};

const STORAGE_KEY = "life-os:last-seen-achievement";

export function AchievementUnlocked({ achievement }: AchievementUnlockedProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!achievement) return;

    try {
      const lastSeen = window.localStorage.getItem(STORAGE_KEY);
      if (lastSeen !== achievement.id) {
        setVisible(true);
      }
    } catch {
      setVisible(true);
    }
  }, [achievement]);

  if (!achievement || !visible) return null;

  const unlockedAchievement = achievement;

  function dismiss() {
    try {
      window.localStorage.setItem(STORAGE_KEY, unlockedAchievement.id);
    } catch {
      // The presentation can still be dismissed when storage is unavailable.
    }
    setVisible(false);
  }

  return (
    <div className={styles.backdrop} role="presentation" onClick={dismiss}>
      <section
        aria-labelledby="achievement-unlocked-title"
        aria-modal="true"
        className={styles.card}
        role="dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <button aria-label="実績解除演出を閉じる" className={styles.close} onClick={dismiss} type="button">
          ×
        </button>
        <div className={styles.emblem} aria-hidden="true">🏆</div>
        <p className={styles.kicker}>ACHIEVEMENT UNLOCKED</p>
        <h2 id="achievement-unlocked-title">{unlockedAchievement.name}</h2>
        <p className={styles.flavor}>
          {unlockedAchievement.flavorText || "世界は、ひとつの体験によって少しだけ広がった。"}
        </p>
        <div className={styles.reward}>
          <span>{unlockedAchievement.tier ?? "Achievement"}</span>
          <strong>+{unlockedAchievement.xp.toLocaleString()} XP</strong>
        </div>
        <Link className={styles.link} href={`/achievements/${unlockedAchievement.id}`} onClick={dismiss}>
          実績を見る →
        </Link>
      </section>
    </div>
  );
}
