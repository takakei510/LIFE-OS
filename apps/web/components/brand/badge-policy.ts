export type BadgeTier = "common" | "uncommon" | "rare" | "epic" | "legendary" | "unknown";
export function badgeTier(tier?: string | null): BadgeTier {
  const match = tier?.match(/\b(common|uncommon|rare|epic|legendary)\b/i);
  return match ? match[1].toLowerCase() as BadgeTier : "unknown";
}

export function badgeMotif(domains: readonly string[]): "cafe" | "photo" | "nature" | "star" {
  for (const domain of domains) {
    if (domain === "Cafe") return "cafe";
    if (domain === "Photography") return "photo";
    if (domain === "Nature") return "nature";
  }
  return "star";
}
