import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./mobile-bottom-nav.css";
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
  themeColor: "#090b10",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body>
        {children}
        <MobileBottomNav />
      </body>
    </html>
  );
}
