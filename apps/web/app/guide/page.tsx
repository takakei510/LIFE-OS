import Link from "next/link";
import { AdventureGuide } from "./adventure-guide";
import styles from "./guide.module.css";
export const metadata = { title: "探索案内人 | LIFE OS" };
export default function GuidePage() {
  const enabled = process.env.GUIDE_ENABLED === "true" && process.env.GUIDE_FREE_CREDITS_VERIFIED === "true" && Boolean(process.env.AI_GATEWAY_MODEL);
  return <main className={styles.page}>
    <nav className="pageNav" aria-label="ページ移動"><Link href="/">HOME</Link><Link href="/achievements">実績</Link><Link href="/quests">クエスト</Link></nav>
    <header className={styles.header}><span className={styles.eyebrow}>ADVENTURE GUIDE</span><h1>今日は、どんな冒険にしよう。</h1><p>気分や今いる場所から、あなたに合いそうな世界への入口を一緒に探します。</p></header>
    <AdventureGuide enabled={enabled} />
  </main>;
}
