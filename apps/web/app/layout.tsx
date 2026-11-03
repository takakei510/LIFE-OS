import type { Metadata, Viewport } from "next";
import "@fontsource-variable/noto-sans-jp";
import "@fontsource-variable/space-grotesk";
import "./design-tokens.css";
import "./globals.css";
import "./mobile-bottom-nav.css";
import "./loading.css";
import { MobileBottomNav } from "./mobile-bottom-nav";

export const metadata: Metadata = {
  title: "LIFE OS",
  description: "世界に触れた記録を楽しむ、人生のSteam。",
  applicationName: "LIFE OS",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "LIFE OS",
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
        <div id="main-content" tabIndex={-1}>{children}</div>
      </body>
    </html>
  );
}
