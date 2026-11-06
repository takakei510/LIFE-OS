"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { AchievementBadge } from "@/components/brand/achievement-badge";
import { CategoryName, TierName } from "@/components/life-icons/life-icon";
import { achievementPresentation, categoryLabel } from "@/components/life-icons/presentation";
import { NeoButton } from "@/components/ui/neo-button";
import { layoutTree, NODE_HEIGHT, NODE_WIDTH, treeStateLabel } from "@/lib/life-os/achievement-tree/model";
import type { TreeModel, TreeNode } from "@/lib/life-os/achievement-tree/model";

const nodeName = (node: TreeNode) => node.masked ? "？？？" : achievementPresentation(node).name;

type View = { x: number; y: number; scale: number };
type Point = { x: number; y: number };
const subscribeMobile = (callback: () => void) => { const media = window.matchMedia("(max-width: 640px)"); media.addEventListener("change", callback); return () => media.removeEventListener("change", callback); };
const mobileSnapshot = () => window.matchMedia("(max-width: 640px)").matches;
const serverSnapshot = () => false;

export function AchievementTree({ model, initialCategory }: { model: TreeModel; initialCategory?: string }) {
  const isMobile = useSyncExternalStore(subscribeMobile, mobileSnapshot, serverSnapshot);
  const categories = useMemo(() => [...new Set(model.nodes.map((node) => node.category).filter((value): value is string => value !== null))].sort(), [model.nodes]);
  const [scope, setScope] = useState(initialCategory ?? "auto");
  const category = scope === "auto" ? isMobile ? categories.find((value) => categoryLabel(value) === "探索") ?? categories[0] ?? "all" : "all" : scope;
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const filtered = useMemo(() => ({ nodes: model.nodes.filter((node) => category === "all" || node.category === category), edges: model.edges }), [model, category]);
  const layout = useMemo(() => layoutTree(filtered), [filtered]);
  const positions = useMemo(() => new Map(layout.nodes.map((node) => [node.id, node])), [layout.nodes]);
  const matches = useMemo(() => new Set(layout.nodes.filter((node) => [node.name, node.requirement, node.flavorText, categoryLabel(node.category)].join(" ").toLocaleLowerCase("ja").includes(query.trim().toLocaleLowerCase("ja"))).map((node) => node.id)), [layout.nodes, query]);
  const selected = positions.get(selectedId ?? "");
  const viewport = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 800, height: 500 });
  const [view, setView] = useState<View>({ x: 0, y: 0, scale: 1 });
  const current = useRef(view);
  const updateView = useCallback((value: View) => { current.current = value; setView(value); }, []);
  const fitScale = Math.min((size.width - 24) / layout.width, (size.height - 24) / layout.height, 1);
  const fit = useCallback(() => updateView({ scale: fitScale, x: (size.width - layout.width * fitScale) / 2, y: (size.height - layout.height * fitScale) / 2 }), [fitScale, layout.width, layout.height, size.width, size.height, updateView]);
  useEffect(() => {
    const element = viewport.current; if (!element) return;
    const observer = new ResizeObserver(([entry]) => setSize({ width: entry.contentRect.width, height: entry.contentRect.height }));
    observer.observe(element); return () => observer.disconnect();
  }, []);
  useEffect(() => { fit(); }, [fit]);
  const zoomAt = useCallback((factor: number, point: Point) => {
    const old = current.current; const scale = Math.min(2.5, Math.max(Math.min(.12, fitScale), old.scale * factor));
    updateView({ scale, x: point.x - (point.x - old.x) * scale / old.scale, y: point.y - (point.y - old.y) * scale / old.scale });
  }, [fitScale, updateView]);
  useEffect(() => {
    const element = viewport.current; if (!element) return;
    const wheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault(); const rect = element.getBoundingClientRect();
      zoomAt(Math.exp(-event.deltaY * .004), { x: event.clientX - rect.left, y: event.clientY - rect.top });
    };
    element.addEventListener("wheel", wheel, { passive: false }); return () => element.removeEventListener("wheel", wheel);
  }, [zoomAt]);
  const focusNode = useCallback((id: string) => {
    const node = positions.get(id); if (!node) return;
    const scale = Math.max(.8, current.current.scale);
    setSelectedId(id); updateView({ scale, x: size.width / 2 - (node.x + NODE_WIDTH / 2) * scale, y: size.height / 2 - (node.y + NODE_HEIGHT / 2) * scale });
  }, [positions, size, updateView]);
  const pointers = useRef(new Map<number, Point>());
  const gesture = useRef<{ view: View; center: Point; distance: number; start: Point; node: string | null; moved: boolean } | null>(null);
  const resetGesture = (node: string | null = null) => {
    const points = [...pointers.current.values()]; if (!points.length) { gesture.current = null; return; }
    const center = points.length > 1 ? { x: (points[0].x + points[1].x) / 2, y: (points[0].y + points[1].y) / 2 } : points[0];
    gesture.current = { view: { ...current.current }, center, distance: points.length > 1 ? Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y) : 0, start: center, node, moved: points.length > 1 };
  };
  const pointOf = (event: ReactPointerEvent) => { const rect = event.currentTarget.getBoundingClientRect(); return { x: event.clientX - rect.left, y: event.clientY - rect.top }; };
  const onDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    pointers.current.set(event.pointerId, pointOf(event));
    event.currentTarget.setPointerCapture(event.pointerId);
    const node = (event.target as Element).closest<HTMLElement>("[data-node-id]")?.dataset.nodeId ?? null;
    resetGesture(node);
  };
  const onMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(event.pointerId) || !gesture.current) return;
    pointers.current.set(event.pointerId, pointOf(event)); const points = [...pointers.current.values()]; const g = gesture.current;
    const center = points.length > 1 ? { x: (points[0].x + points[1].x) / 2, y: (points[0].y + points[1].y) / 2 } : points[0];
    if (Math.hypot(center.x - g.start.x, center.y - g.start.y) > 6 || points.length > 1) g.moved = true;
    const scale = points.length > 1 && g.distance > 0 ? Math.min(2.5, Math.max(Math.min(.12, fitScale), g.view.scale * Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y) / g.distance)) : g.view.scale;
    updateView({ scale, x: center.x - (g.center.x - g.view.x) * scale / g.view.scale, y: center.y - (g.center.y - g.view.y) * scale / g.view.scale });
  };
  const onUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const g = gesture.current; if (!pointers.current.has(event.pointerId)) return;
    pointers.current.delete(event.pointerId);
    if (event.type === "pointerup" && g && !g.moved && g.node) focusNode(g.node);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    resetGesture();
  };
  const pan = (x: number, y: number) => updateView({ ...current.current, x: current.current.x + x, y: current.current.y + y });

  return <>
    <div className="treeFilters">
      <label>表示する世界<select aria-label="表示する世界" value={category} onChange={(event) => { setScope(event.target.value); setSelectedId(null); }}><option value="all">すべての実績</option>{categories.map((value) => <option key={value} value={value}>{categoryLabel(value)}</option>)}</select></label>
      <label>実績を探す<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="名前・条件を検索" /></label>
      <label>実績を選ぶ<select aria-label="実績を選ぶ" value={selected && matches.has(selected.id) ? selected.id : ""} onChange={(event) => focusNode(event.target.value)}><option value="">{query ? `${matches.size}件の検索結果` : "ノードへ移動"}</option>{layout.nodes.filter((node) => matches.has(node.id)).map((node, index) => <option key={node.id} value={node.id}>{node.masked ? `未発見の実績 ${index + 1}` : nodeName(node)} · {treeStateLabel(node.state)}</option>)}</select></label>
    </div>
    <p className="treeSummary">{layout.nodes.length} / {model.nodes.length} 実績 · {layout.edges.length} 本の前提関係</p>
    <div className="treeLegend"><span data-state="unlocked">解除済み</span><span data-state="available">挑戦可能</span><span data-state="locked">未発見</span><span data-state="review">関係を確認中</span></div>
    <div className="treeWorkspace">
      <section className="treeMapSection" aria-label="実績のつながり">
        <div className="treeControls">
          <NeoButton variant="secondary" aria-label="拡大" onClick={() => zoomAt(1.4, { x: size.width / 2, y: size.height / 2 })}>＋</NeoButton>
          <NeoButton variant="secondary" aria-label="縮小" onClick={() => zoomAt(1 / 1.4, { x: size.width / 2, y: size.height / 2 })}>−</NeoButton>
          <NeoButton variant="secondary" onClick={fit}>全体を表示</NeoButton><span>{Math.round(view.scale * 100)}%</span>
          <div className="treePanControls" aria-label="表示位置を移動"><NeoButton variant="ghost" aria-label="左へ移動" onClick={() => pan(100, 0)}>←</NeoButton><NeoButton variant="ghost" aria-label="上へ移動" onClick={() => pan(0, 100)}>↑</NeoButton><NeoButton variant="ghost" aria-label="下へ移動" onClick={() => pan(0, -100)}>↓</NeoButton><NeoButton variant="ghost" aria-label="右へ移動" onClick={() => pan(-100, 0)}>→</NeoButton></div>
        </div>
        <p className="treeHint" id="tree-instructions">ドラッグで移動・2本指で拡大縮小。PCはCtrl＋スクロールでも拡大できます。実績を選ぶと内容を表示します。</p>
        <div ref={viewport} className="treeViewport" tabIndex={0} aria-label="実績ツリー" aria-describedby="tree-instructions" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} onKeyDown={(event) => { if (event.target !== event.currentTarget) return; const movement: Record<string, [number, number]> = { ArrowLeft: [100, 0], ArrowRight: [-100, 0], ArrowUp: [0, 100], ArrowDown: [0, -100] }; if (movement[event.key]) { event.preventDefault(); pan(...movement[event.key]); } }}>
          {layout.nodes.length === 0 ? <p className="treeEmpty">表示できる実績がありません。</p> : <div className="treeCamera" data-compact={view.scale < .42} style={{ width: layout.width, height: layout.height, transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})` }}>
            <svg className="treeEdges" width={layout.width} height={layout.height} aria-hidden="true">{layout.edges.map((edge) => { const from = positions.get(edge.from)!; const to = positions.get(edge.to)!; const x1 = from.x + NODE_WIDTH, y1 = from.y + NODE_HEIGHT / 2, x2 = to.x, y2 = to.y + NODE_HEIGHT / 2; return <path key={`${edge.from}:${edge.to}`} d={`M${x1},${y1} C${x1 + 40},${y1} ${x2 - 40},${y2} ${x2},${y2}`} data-active={from.state === "unlocked"} />; })}</svg>
            {layout.nodes.map((node) => <button type="button" key={node.id} data-node-id={node.id} data-state={node.state} className={`treeNode${selectedId === node.id ? " isSelected" : ""}${query && !matches.has(node.id) ? " isDimmed" : ""}`} style={{ left: node.x, top: node.y, width: NODE_WIDTH, height: NODE_HEIGHT }} aria-label={`${node.masked ? "未発見の実績" : nodeName(node)}、${treeStateLabel(node.state)}`} aria-pressed={selectedId === node.id} onClick={(event) => { if (event.detail === 0) focusNode(node.id); }} onFocus={() => { if (!pointers.current.size) focusNode(node.id); }}>
              <AchievementBadge tier={node.tier} domains={node.domains} achievementId={node.masked ? undefined : node.id} achievementName={node.name} /><span className="treeNodeName">{nodeName(node)}</span><span className="treeNodeState">{node.masked ? "未発見" : treeStateLabel(node.state)}</span>
            </button>)}
          </div>}
        </div>
        <p className="treeHint">線はNotionに登録された前提関係です。独立した実績も並べています。カテゴリ外・非公開の関係はこの表示には含めません。</p>
      </section>
      <aside className="treeDetail" aria-label="選択した実績">
        {selected ? <><p className="eyebrow">{treeStateLabel(selected.state)}</p><h2>{nodeName(selected)}</h2><p><CategoryName category={selected.category} /></p>
          {selected.masked ? <p>前提実績を解除すると、名前と条件が明らかになります。参照先の欠損・循環がある場合は、Notionの関係を確認してください。</p> : <><p>{selected.flavorText}</p><h3>達成条件</h3><p>{selected.requirement || "達成条件は未設定です。"}</p><p><TierName tier={selected.tier} /> · {selected.xp} XP</p>{selected.href ? <Link className="notionLink" href={selected.href}>実績の詳細へ →</Link> : null}</>}
          <p className="muted">前提実績 {selected.prerequisiteCount} 件</p>
        </> : <><h2>気になる実績を選ぶ</h2><p>ノードをタップするか「実績を選ぶ」から探せます。まだ触れていない世界とのつながりを眺めてみましょう。</p></>}
      </aside>
    </div>
    <p role="status" className="treeSelectionStatus">{selected ? `${selected.masked ? "未発見の実績" : nodeName(selected)}を選択しました。` : ""}</p>
  </>;
}


