import Link from "next/link";
import { buildTreeModel } from "@/lib/life-os/achievement-tree/model";
import { readAchievementTreeRecords } from "@/lib/notion/repositories/achievement-tree";
import { AchievementTree } from "./achievement-tree";
import "./tree.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "実績ツリー | Life OS", description: "世界に触れた記録のつながりを眺める。" };

export default async function AchievementTreePage({ searchParams }: { searchParams: Promise<{ category?: string | string[] }> }) {
  const requested = (await searchParams).category;
  let model;
  try { model = buildTreeModel(await readAchievementTreeRecords(), true); }
  catch { return <main><h1>実績ツリーを読み込めませんでした。</h1><p className="muted">時間をおいて、もう一度開いてください。</p><Link href="/achievements/tree">再読み込みする →</Link></main>; }
  const initialCategory = typeof requested === "string" && (requested === "all" || model.nodes.some((node) => node.category === requested)) ? requested : undefined;
  return <main className="treePage"><header className="pageHeader"><p className="eyebrow">ACHIEVEMENT TREE</p><h1>体験は、つながっていく。</h1><p className="lead">集めてきた発見と、その先に広がる冒険を眺める。</p></header>
    <nav className="achievementViews" aria-label="実績の表示方法"><Link href="/achievements">一覧</Link><Link href="/achievements/tree" aria-current="page">ツリー</Link></nav>
    <AchievementTree model={model} initialCategory={initialCategory} />
  </main>;
}
