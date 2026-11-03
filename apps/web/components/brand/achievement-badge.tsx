import { badgeTier } from "./badge-policy";
import { achievementPresentation, domainMotif } from "../life-icons/presentation";

export function AchievementBadge({ tier, domains, size = 48, achievementId, achievementName }: { tier?: string | null; domains: readonly string[]; size?: 48 | 64; achievementId?: string; achievementName?: string }) {
  const motif = achievementId && achievementName
    ? achievementPresentation({ id: achievementId, name: achievementName, domains }).motif : domainMotif(domains);
  return <svg className="achievementBadge" data-tier={badgeTier(tier)} data-motif={motif} width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true" focusable="false">
    <path d="m32 3 25 14.5v29L32 61 7 46.5v-29Z" fill="var(--neo-surface)" stroke="currentColor" strokeWidth="2"/>
    <path d="m32 8 20.5 12v24L32 56 11.5 44V20Z" stroke="currentColor" strokeWidth="1" opacity=".24"/>
    <svg x="16" y="16" width="32" height="32" viewBox="0 0 24 24" className="lifeBadgeMotif"><use href={`#${motif}`}/></svg>
  </svg>;
}
