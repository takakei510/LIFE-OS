import type { ReactNode } from "react";

export type NeoIconName = "home" | "achievement" | "quest" | "memory" | "title" | "status" | "planet" | "arrow" | "check";
const paths: Record<NeoIconName, ReactNode> = {
  home: <><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z"/><path d="M8 8h8" opacity=".45"/></>,
  achievement: <><path d="M7 3h10v7a5 5 0 0 1-10 0Z"/><path d="M7 5H3v3a4 4 0 0 0 4 4m10-7h4v3a4 4 0 0 1-4 4M12 15v5m-4 1h8"/></>,
  quest: <><path d="M5 22V3m0 1c5-4 9 4 15 0v11c-6 4-10-4-15 0"/><path d="m10 8 2 2 3-3"/></>,
  memory: <><path d="M12 6C9 3 5 3 2 5v15c3-2 7-2 10 1 3-3 7-3 10-1V5c-3-2-7-2-10 1Zm0 0v15"/></>,
  title: <><path d="m3 6 4 5 5-7 5 7 4-5-2 14H5Z"/><path d="M6 16h12"/></>,
  status: <path d="M3 21V13h4v8Zm7 0V8h4v13Zm7 0V3h4v18Z"/>,
  planet: <><circle cx="12" cy="12" r="7.5"/><ellipse cx="12" cy="12" rx="12" ry="3.5" transform="rotate(-30 12 12)"/><path d="m6 6 3-2m7 15 2-2" opacity=".45"/></>,
  arrow: <><path d="M4 12h15m-6-6 6 6-6 6"/></>,
  check: <path d="m5 12 4 4L19 6"/>,
};

/** Decorative by default; give title only when there is no adjacent text label. */
export function NeoIcon({name, size = 24, title, className}: {name: NeoIconName; size?: number; title?: string; className?: string}) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" focusable="false" aria-hidden={title ? undefined : true} aria-label={title} role={title ? "img" : undefined} className={className}>
    {title ? <title>{title}</title> : null}{paths[name]}
  </svg>;
}
