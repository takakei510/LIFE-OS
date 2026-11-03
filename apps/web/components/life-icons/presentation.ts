import { badgeTier } from "../brand/badge-policy";
import { achievementDecorations } from "./decoration-registry";
export type LifeMotif = "life-music" | "life-discovery" | "life-window" | "life-nature" | "life-cafe" | "life-cooking" | "life-photo" | "life-reading" | "life-journey" | "life-creation" | "life-research" | "life-connection" | "life-general";
export type LifeIconId = LifeMotif | "life-rank-beginner";
export type IconAchievement = { id: string; name: string; domains: readonly string[] };
// Existing normalized Domain identifiers; never inferred from Japanese display names.
const domains: Readonly<Record<string, LifeMotif>> = {
  Music: "life-music", Nature: "life-nature", Cafe: "life-cafe", Cooking: "life-cooking",
  Photography: "life-photo", Reading: "life-reading", Travel: "life-journey", Writing: "life-creation",
  Research: "life-research", Communication: "life-connection", Relationship: "life-connection",
};
// Specific approved motifs; all other registered prefixes use the existing Domain mapping.
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
  const id = achievement.id.replaceAll("-", "").toLowerCase();
  const entry = Object.hasOwn(achievementDecorations, id) ? achievementDecorations[id] : undefined;
  const matches = entry && achievement.name.startsWith(entry.prefix);
  const override = Object.hasOwn(approved, id) ? approved[id] : undefined;
  return { name: matches ? achievement.name.slice(entry.prefix.length) : achievement.name, motif: matches && override?.prefix === entry.prefix ? override.motif : domainMotif(achievement.domains) };
}

// Exact existing Category identifiers. Unknown categories remain verbatim.
const categories: Readonly<Record<string, { label: string; motif: LifeMotif }>> = {
  "🧪 探索": { label: "探索", motif: "life-journey" },
  "🌿 日常": { label: "日常", motif: "life-nature" },
  "🎸 育成": { label: "育成", motif: "life-general" },
  "💪 身体": { label: "身体", motif: "life-general" },
  "🎨 創作": { label: "創作", motif: "life-creation" },
  "🧠 内面": { label: "内面", motif: "life-discovery" },
};
export function categoryPresentation(category?: string | null) {
  return category && Object.hasOwn(categories, category) ? categories[category] : { label: category || "未分類", motif: "life-general" as LifeMotif };
}
export function categoryLabel(category?: string | null) { return categoryPresentation(category).label; }
const labels = { common: "Common", uncommon: "Uncommon", rare: "Rare", epic: "Epic", legendary: "Legendary", unknown: "Tier未設定" };
export function tierLabel(tier?: string | null) { return labels[badgeTier(tier)]; }
export function beginnerLabel(rank: string) { return rank === "🌱 Beginner" || rank === "Beginner" ? "Beginner" : null; }
