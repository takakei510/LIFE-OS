import type { Achievement } from "@/lib/notion/types";

export function isChainLocked(achievement: Achievement, all: Achievement[]): boolean {
  if (achievement.unlocked || achievement.prerequisites.length === 0) return false;
  const byId = new Map(all.map((item) => [item.id, item]));
  return achievement.prerequisites.some((id) => !byId.get(id)?.unlocked);
}

export function publicAchievement(achievement: Achievement, all: Achievement[]): Achievement {
  if (!isChainLocked(achievement, all)) return achievement;
  return {
    ...achievement,
    name: "？？？",
    requirement: "",
    flavorText: "",
    tier: null,
    xp: 0,
    domains: [],
    category: null,
    evidenceHeadline: "",
    evidenceNote: "",
    evidenceSource: "",
    evidenceStrength: null,
    url: "",
    lockedByChain: true,
  };
}
