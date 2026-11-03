import { badgeTier } from "../brand/badge-policy";
export type LifeMotif = "life-music" | "life-discovery" | "life-window" | "life-nature" | "life-cafe" | "life-cooking" | "life-photo" | "life-reading" | "life-journey" | "life-creation" | "life-research" | "life-connection" | "life-general";
export type LifeIconId = LifeMotif | "life-rank-beginner";
export type IconAchievement = { id: string; name: string; domains: readonly string[] };
// Existing normalized Domain identifiers; never inferred from Japanese display names.
const domains: Readonly<Record<string, LifeMotif>> = {
  Music: "life-music", Nature: "life-nature", Cafe: "life-cafe", Cooking: "life-cooking",
  Photography: "life-photo", Reading: "life-reading", Travel: "life-journey", Writing: "life-creation",
  Research: "life-research", Communication: "life-connection", Relationship: "life-connection",
};
// Exact ID + decoration pairs approved by the user. The source name is never modified.
const approved: Readonly<Record<string, { prefix: string; motif: LifeMotif }>> = {
  "3a4391a354a981669b6ddc2bdde050d0": { prefix: "🎵 ", motif: "life-music" },
  "3a4391a354a9815ea951e81e874c9b40": { prefix: "🪞 ", motif: "life-discovery" },
  "3a4391a354a981cd9ad1e02417134d11": { prefix: "🪟 ", motif: "life-window" },
};
export function domainMotif(values: readonly string[]): LifeMotif {
  for (const value of values) if (Object.hasOwn(domains, value)) return domains[value];
  return "life-general";
}
export function achievementPresentation(achievement: IconAchievement) {
  const entry = approved[achievement.id.replaceAll("-", "").toLowerCase()];
  const matches = entry && achievement.name.startsWith(entry.prefix);
  return { name: matches ? achievement.name.slice(entry.prefix.length) : achievement.name, motif: matches ? entry.motif : domainMotif(achievement.domains) };
}
const labels = { common: "Common", uncommon: "Uncommon", rare: "Rare", epic: "Epic", legendary: "Legendary", unknown: "Tier未設定" };
export function tierLabel(tier?: string | null) { return labels[badgeTier(tier)]; }
export function beginnerLabel(rank: string) { return rank === "🌱 Beginner" || rank === "Beginner" ? "Beginner" : null; }
