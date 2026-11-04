"use client";

import Link from "next/link";
import { BrandLogo } from "@/components/brand/stellar-compass";
import { usePathname } from "next/navigation";
import { NeoIcon, type NeoIconName } from "@/components/ui/neo-icon";

const items: {href: string; label: string; icon: NeoIconName}[] = [
  { href: "/", label: "ホーム", icon: "home" },
  { href: "/achievements", label: "実績", icon: "achievement" },
  { href: "/quests", label: "クエスト", icon: "quest" },
  { href: "/adventure-logs", label: "冒険ログ", icon: "memory" },
  { href: "/titles", label: "称号", icon: "title" },
  { href: "/status", label: "ステータス", icon: "status" },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="mobileBottomNav" aria-label="メインナビゲーション">
      <Link href="/" className="neoBrand" aria-label="Life OS ホーム"><BrandLogo/></Link>
      <div className="neoNavItems">
      {items.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={active ? "mobileBottomNavItem mobileBottomNavItem--active" : "mobileBottomNavItem"}
            aria-current={active ? "page" : undefined}
          >
            <NeoIcon name={item.icon} className="mobileBottomNavIcon" size={22} />
            <span>{item.label}</span>
          </Link>
        );
      })}
      </div>
    </nav>
  );
}
