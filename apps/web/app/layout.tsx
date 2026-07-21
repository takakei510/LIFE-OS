import type { Metadata } from "next";
import "./globals.css";
import "./mobile-bottom-nav.css";
import { MobileBottomNav } from "./mobile-bottom-nav";

export const metadata: Metadata = {
  title: "LIFE OS",
  description: "世界に触れた記録を楽しむ、人生のSteam。",
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
