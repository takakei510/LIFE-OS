import type { LifeIconId, IconAchievement } from "./presentation";
import { achievementPresentation, beginnerLabel, tierLabel, categoryPresentation } from "./presentation";
import { badgeTier } from "../brand/badge-policy";

export function LifeIcon({ name, size = 20, label }: { name: LifeIconId; size?: 16 | 20 | 24 | 32; label?: string }) {
  return <svg className="lifeIcon" width={size} height={size} viewBox="0 0 24 24" data-icon={name} data-variant={size <= 20 ? "small" : "standard"} aria-hidden={label ? undefined : true} role={label ? "img" : undefined} aria-label={label} focusable="false"><use href={`#${name}${size <= 20 ? "-small" : ""}`}/></svg>;
}
export function AchievementName({ achievement, size = 20 }: { achievement: IconAchievement; size?: 16 | 20 | 24 }) {
  const presentation = achievementPresentation(achievement);
  return <span className="lifeAchievementName"><LifeIcon name={presentation.motif} size={size}/><span>{presentation.name}</span></span>;
}
export function TierName({ tier }: { tier?: string | null }) {
  return <span className="lifeTierName" data-tier={badgeTier(tier)}>{tierLabel(tier)}</span>;
}
export function PlayerRank({ rank }: { rank: string }) {
  const label = beginnerLabel(rank);
  return <span className="lifePlayerRank">{label ? <LifeIcon name="life-rank-beginner" size={20}/> : null}<span>{label ?? rank}</span></span>;
}

export function CategoryName({ category }: { category?: string | null }) {
  const presentation = categoryPresentation(category);
  return <span className="lifeCategoryName"><LifeIcon name={presentation.motif} size={16}/><span>{presentation.label}</span></span>;
}

export function LogTypeIcon({ logTypes, size = 16 }: { logTypes: readonly string[]; size?: 16 | 24 }) {
  const name = logTypes.includes("Photo") ? "life-photo" : logTypes.includes("Audio") ? "life-music" : logTypes.includes("Place") ? "life-journey" : "life-general";
  return <LifeIcon name={name} size={size}/>;
}
