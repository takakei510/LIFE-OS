"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

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

  function dismiss() {
    try {
      window.localStorage.setItem(STORAGE_KEY, achievement.id);
    } catch {
      // The presentation can still be dismissed when storage is unavailable.
    }
    setVisible(false);
  }

  return (
    <div className="unlockBackdrop" role="presentation" onClick={dismiss}>
      <section
        aria-labelledby="achievement-unlocked-title"
        aria-modal="true"
        className="unlockCard"
        role="dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <button aria-label="実績解除演出を閉じる" className="unlockClose" onClick={dismiss} type="button">
          ×
        </button>
        <div className="unlockEmblem" aria-hidden="true">🏆</div>
        <p className="unlockKicker">ACHIEVEMENT UNLOCKED</p>
        <h2 id="achievement-unlocked-title">{achievement.name}</h2>
        <p className="unlockFlavor">
          {achievement.flavorText || "世界は、ひとつの体験によって少しだけ広がった。"}
        </p>
        <div className="unlockReward">
          <span>{achievement.tier ?? "Achievement"}</span>
          <strong>+{achievement.xp.toLocaleString()} XP</strong>
        </div>
        <Link className="unlockLink" href={`/achievements/${achievement.id}`} onClick={dismiss}>
          実績を見る →
        </Link>
      </section>
    </div>
  );
}
