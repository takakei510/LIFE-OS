import Link from "next/link";
import { buildTreeModel, treeId } from "@/lib/life-os/achievement-tree/model";
import { readAchievementAccess } from "@/lib/notion/repositories/achievement-tree";
import { AchievementTree } from "./achievement-tree";
import { DiscoverClusters } from "./discover-clusters";
import "./tree.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "実績ツリー | Life OS", description: "世界に触れた記録のつながりを眺める。" };

export default async function AchievementTreePage({ searchParams }: { searchParams: Promise<{ category?: string | string[] }> }) {
  const requested = (await searchParams).category;
  let model;
  let access;
  try {
    access = await readAchievementAccess();
    model = buildTreeModel(access.records, true);
  }
  catch { return <main><h1>実績ツリーを読み込めませんでした。</h1><p className="muted">時間をおいて、もう一度開いてください。</p><Link href="/achievements/tree">再読み込みする →</Link></main>; }
  const initialCategory = typeof requested === "string" && (requested === "all" || model.nodes.some((node) => node.category === requested)) ? requested : undefined;
  const publicRoots = new Map(model.nodes.filter(node => node.href).map(node => [treeId(node.id), node]));
  return <main className="treePage"><header className="pageHeader"><p className="eyebrow">ACHIEVEMENT TREE</p><h1>体験は、つながっていく。</h1><p className="lead">集めてきた発見と、その先に広がる冒険を眺める。</p></header>
    <nav className="achievementViews" aria-label="実績の表示方法"><Link href="/achievements">一覧</Link><Link href="/achievements/tree" aria-current="page">ツリー</Link></nav>
    {access.canDiscover ? <DiscoverClusters /> : null}
    {access.clusters.length ? (
      <section aria-label="発見したつながり">
        <h2>発見したつながり</h2>
        <ul>
          {access.clusters.map(cluster => (
            <li key={cluster.id}>
              <strong>{cluster.name}</strong>
              <ul>
                {cluster.roots.map(root => {
                  const node = publicRoots.get(root);
                  return node?.href ? <li key={root}><Link href={node.href}>{node.name}</Link></li> : null;
                })}
              </ul>
            </li>
          ))}
        </ul>
      </section>
    ) : null}
    <AchievementTree model={model} initialCategory={initialCategory} />
  </main>;
}
