export type Tier = "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary" | string;

export type Achievement = {
  id: string;
  name: string;
  category: string | null;
  domains: string[];
  tier: Tier | null;
  xp: number;
  requirement: string;
  flavorText: string;
  unlocked: boolean;
  unlockedAt: string | null;
  visibility: string | null;
  url: string;
};

export type Quest = {
  id: string;
  name: string;
  category: string | null;
  questType: string | null;
  state: string | null;
  rewardXp: number;
  description: string;
  completionCondition: string;
  completedAt: string | null;
  url: string;
};

export type Title = {
  id: string;
  name: string;
  tier: Tier | null;
  description: string;
  unlocked: boolean;
  equipped: boolean;
  url: string;
};

export type PlayerStatus = {
  id: string;
  name: string;
  totalXp: number;
  level: number;
  nextLevelXp: number;
  progress: number;
  playerRank: string | null;
  unlockedAchievements: number;
  unlockedTitles: number;
  completedQuests: number;
  url: string;
};

export type LifeOsSnapshot = {
  achievements: Achievement[];
  quests: Quest[];
  titles: Title[];
  player: PlayerStatus | null;
  source: "notion" | "fallback";
  warning?: string;
};
