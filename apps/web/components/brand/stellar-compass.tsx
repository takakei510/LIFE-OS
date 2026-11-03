import { useId } from "react";

/** Pure artwork also used by the generated PWA icon. */
export function CompassArtwork({ idPrefix, size = 36 }: { idPrefix: string; size?: number }) {
  const gradient = `${idPrefix}-compass`;
  return <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true" focusable="false">
    <defs><linearGradient id={gradient} x1="8" y1="8" x2="56" y2="58" gradientUnits="userSpaceOnUse"><stop stopColor="#E6F2FF"/><stop offset=".45" stopColor="#7CE1FF"/><stop offset="1" stopColor="#A78BFA"/></linearGradient></defs>
    <g stroke={`url(#${gradient})`} strokeWidth="2.8" strokeLinecap="round"><path d="M10 25a23 23 0 0 1 15-15M39 10a23 23 0 0 1 15 15M54 39a23 23 0 0 1-15 15M25 54a23 23 0 0 1-15-15"/></g>
    <path d="m32 2 4.5 25.5L62 32l-25.5 4.5L32 62l-4.5-25.5L2 32l25.5-4.5Z" fill={`url(#${gradient})`}/>
    <path d="M32 2v30L2 32l25.5-4.5ZM32 32v30l4.5-25.5L62 32Z" fill="#E6F2FF" opacity=".82"/>
    <path d="m55 3 1.5 4.5L61 9l-4.5 1.5L55 15l-1.5-4.5L49 9l4.5-1.5Z" fill="#E6F2FF"/>
  </svg>;
}

export function StellarCompass({ size = 36 }: { size?: number }) {
  const id = useId();
  return <CompassArtwork idPrefix={id.replace(/:/g, "")} size={size}/>;
}

export function BrandLogo() {
  return <span className="brandLogo"><StellarCompass/><span>Life OS</span></span>;
}
