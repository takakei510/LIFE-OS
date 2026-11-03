import type { Metadata, Viewport } from "next";
import "@fontsource-variable/noto-sans-jp";
import "@fontsource-variable/sora";
import "./design-tokens.css";
import "./globals.css";
import "./mobile-bottom-nav.css";
import "./loading.css";
import "./brand.css";
import Link from "next/link";
import { BrandLogo } from "@/components/brand/stellar-compass";
import { MobileBottomNav } from "./mobile-bottom-nav";

export const metadata: Metadata = {
  title: "Life OS",
  description: "世界に触れた記録を楽しむ、人生のSteam。",
  applicationName: "Life OS",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Life OS",
  },
  icons: {
    icon: "/icon",
    apple: "/icon",
  },
};

export const viewport: Viewport = {
  themeColor: "#0B1220",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body>
        <a className="skipLink" href="#main-content">本文へ移動</a>
        <MobileBottomNav />
        <header className="brandMobileHeader"><Link href="/" aria-label="Life OS ホーム"><BrandLogo/></Link></header>
        <div id="main-content" tabIndex={-1}>{children}</div>
      </body>
    </html>
  );
}
