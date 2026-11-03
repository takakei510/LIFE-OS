import { badgeMotif, badgeTier } from "./badge-policy";

/** Decorative: the adjacent achievement name and Tier remain the text labels. */
export function AchievementBadge({ tier, domains, size = 56 }: { tier?: string | null; domains: readonly string[]; size?: number }) {
  const motif = badgeMotif(domains);
  return <svg className="achievementBadge" data-tier={badgeTier(tier)} width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true" focusable="false">
    <path d="m32 3 25 14.5v29L32 61 7 46.5v-29Z" fill="var(--neo-surface)" stroke="currentColor" strokeWidth="3"/>
    <path d="m32 8 20.5 12v24L32 56 11.5 44V20Z" fill="currentColor" fillOpacity=".08" stroke="currentColor" strokeOpacity=".35"/>
    <g stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      {motif === "cafe" ? <><path d="M20 26h21v9a9 9 0 0 1-9 9h-3a9 9 0 0 1-9-9ZM41 27h3a5 5 0 0 1 0 10h-3M19 46h25M26 21v-3m8 3v-3"/></> :
        motif === "photo" ? <><path d="M18 25h8l3-5h8l3 5h7v20H18Z"/><circle cx="32.5" cy="34.5" r="6.5"/></> :
        motif === "nature" ? <><path d="m16 43 12-22 9 15 5-8 9 15Z"/><path d="m23 30 5 3 4-4m7 5 3 2 3-2"/></> :
        <path d="m32 17 4 11 11 4-11 4-4 11-4-11-11-4 11-4Z" fill="currentColor" fillOpacity=".2"/>}
    </g>
  </svg>;
}
