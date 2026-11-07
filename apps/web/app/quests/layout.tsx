import type { Metadata } from "next";
import "./quest-acceptance.css";

export const metadata: Metadata = {
  title: "Quest Board | LIFE OS",
  description: "次に世界へ触れるためのクエストを選ぶLIFE OSの掲示板。",
};

export default function QuestsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
