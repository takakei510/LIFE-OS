export type BadgeTier = "common" | "uncommon" | "rare" | "epic" | "legendary" | "unknown";
export function badgeTier(tier?: string | null): BadgeTier {
  const match = tier?.match(/\b(common|uncommon|rare|epic|legendary)\b/i);
  return match ? match[1].toLowerCase() as BadgeTier : "unknown";
}
