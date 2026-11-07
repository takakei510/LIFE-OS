type CollectionAchievement = { category: string | null; unlocked: boolean; visibility: string | null };

export function isHiddenAchievement(visibility: string | null): boolean {
  const normalized = visibility?.trim().toLowerCase() ?? "";
  return normalized.includes("hidden") || normalized.includes("secret") || normalized.includes("非公開") || normalized.includes("隠し");
}

export function getCollections(achievements: readonly CollectionAchievement[]) {
  const groups = new Map<string | null, { category: string | null; total: number; unlocked: number }>();
  for (const achievement of achievements) {
    if (!achievement.unlocked && isHiddenAchievement(achievement.visibility)) continue;
    const group = groups.get(achievement.category) ?? { category: achievement.category, total: 0, unlocked: 0 };
    group.total += 1;
    if (achievement.unlocked) group.unlocked += 1;
    groups.set(achievement.category, group);
  }
  return [...groups.values()];
}
