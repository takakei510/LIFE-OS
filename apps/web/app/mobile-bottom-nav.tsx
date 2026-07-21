"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "ホーム", icon: "⌂" },
  { href: "/achievements", label: "実績", icon: "🏆" },
  { href: "/quests", label: "クエスト", icon: "✦" },
  { href: "/titles", label: "称号", icon: "♛" },
  { href: "/status", label: "ステータス", icon: "◉" },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="mobileBottomNav" aria-label="モバイルナビゲーション">
      {items.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={active ? "mobileBottomNavItem mobileBottomNavItem--active" : "mobileBottomNavItem"}
            aria-current={active ? "page" : undefined}
          >
            <span className="mobileBottomNavIcon" aria-hidden="true">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
