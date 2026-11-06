import type { Achievement } from "../../notion/types";

export type TreeRecord = { achievement: Achievement; prerequisites: string[]; relationComplete: boolean };
export type TreeState = "unlocked" | "available" | "locked" | "review";
export type TreeNode = {
  id: string; name: string; category: string | null; domains: string[]; tier: string | null;
  xp: number | null; requirement: string; flavorText: string; state: TreeState; masked: boolean;
  href: string | null; prerequisiteCount: number;
};
export type TreeEdge = { from: string; to: string };
export type TreeModel = { nodes: TreeNode[]; edges: TreeEdge[] };

export function treeId(value: string): string { return value.replaceAll("-", "").toLowerCase(); }
export const treeStateLabel = (state: TreeState) => ({ unlocked: "解除済み", available: "挑戦可能", locked: "前提未解除", review: "関係を確認中" })[state];

// The client receives only visible nodes and their visible-to-visible edges.
// Hidden prerequisite IDs and raw relation values never cross this boundary.
export function buildTreeModel(records: TreeRecord[], hideLockedContents: boolean): TreeModel {
  const all = new Map(records.map((record) => [treeId(record.achievement.id), record]));
  const visible = records.filter(({ achievement }) => achievement.visibility?.trim().toLowerCase() !== "hidden" || achievement.unlocked);
  const visibleIds = new Set(visible.map(({ achievement }) => treeId(achievement.id)));
  const incoming = new Map<string, string[]>();
  for (const record of records) incoming.set(treeId(record.achievement.id), [...new Set(record.prerequisites.map(treeId))]);

  // Kahn traversal also marks descendants of unresolved cycles as review-only.
  const indegree = new Map<string, number>();
  const children = new Map<string, string[]>();
  for (const [id, parents] of incoming) {
    indegree.set(id, parents.filter((parent) => all.has(parent)).length);
    for (const parent of parents) if (all.has(parent)) children.set(parent, [...(children.get(parent) ?? []), id]);
  }
  const queue = [...indegree].filter(([, count]) => count === 0).map(([id]) => id);
  const visited = new Set<string>();
  for (let i = 0; i < queue.length; i++) {
    const id = queue[i]; visited.add(id);
    for (const child of children.get(id) ?? []) {
      const count = indegree.get(child)! - 1; indegree.set(child, count);
      if (count === 0) queue.push(child);
    }
  }
  const nodes: TreeNode[] = visible.map((record) => {
    const a = record.achievement;
    const parents = incoming.get(treeId(a.id)) ?? [];
    const uncertain = !record.relationComplete || !visited.has(treeId(a.id)) || parents.some((id) => !all.has(id));
    const state: TreeState = a.unlocked ? "unlocked" : uncertain ? "review" : parents.some((id) => !all.get(id)!.achievement.unlocked) ? "locked" : "available";
    const masked = hideLockedContents && (state === "locked" || state === "review");
    return { id: a.id, name: masked ? "？？？" : a.name, category: a.category,
      domains: masked ? [] : a.domains, tier: masked ? null : a.tier, xp: masked ? null : a.xp,
      requirement: masked ? "" : a.requirement, flavorText: masked ? "" : a.flavorText,
      state, masked, href: masked ? null : `/achievements/${a.id}`, prerequisiteCount: parents.length,
    };
  });
  const edges: TreeEdge[] = [];
  for (const record of visible) for (const parent of incoming.get(treeId(record.achievement.id)) ?? []) {
    if (visibleIds.has(parent)) edges.push({ from: all.get(parent)!.achievement.id, to: record.achievement.id });
  }
  return { nodes, edges };
}

export function publicTreeAchievements(records: TreeRecord[]): Achievement[] {
  const originals = new Map(records.map((record) => [record.achievement.id, record.achievement]));
  return buildTreeModel(records, true).nodes.map((node) => ({ ...originals.get(node.id)!, name: node.name,
    requirement: node.requirement, flavorText: node.flavorText, tier: node.tier, xp: node.xp ?? 0,
    domains: node.domains, url: node.href ? originals.get(node.id)!.url : "", lockedByChain: node.masked,
    prerequisiteState: node.state,
  }));
}

export const NODE_WIDTH = 192;
export const NODE_HEIGHT = 124;
export type PositionedNode = TreeNode & { x: number; y: number };

// Disconnected components are packed as separate blocks. No synthetic root,
// progression edge or category parent is invented for isolated achievements.
export function layoutTree(model: TreeModel): { nodes: PositionedNode[]; edges: TreeEdge[]; width: number; height: number } {
  const byId = new Map(model.nodes.map((node) => [node.id, node]));
  const adjacency = new Map<string, string[]>();
  const parents = new Map<string, string[]>();
  for (const edge of model.edges) if (byId.has(edge.from) && byId.has(edge.to)) {
    adjacency.set(edge.from, [...(adjacency.get(edge.from) ?? []), edge.to]);
    adjacency.set(edge.to, [...(adjacency.get(edge.to) ?? []), edge.from]);
    parents.set(edge.to, [...(parents.get(edge.to) ?? []), edge.from]);
  }
  const seen = new Set<string>();
  const components: string[][] = [];
  for (const node of model.nodes) {
    if (seen.has(node.id)) continue;
    const component = [node.id]; seen.add(node.id);
    for (let i = 0; i < component.length; i++) for (const next of adjacency.get(component[i]) ?? []) if (!seen.has(next)) { seen.add(next); component.push(next); }
    components.push(component);
  }
  components.sort((a, b) => b.length - a.length || a[0].localeCompare(b[0]));
  const result: PositionedNode[] = [];
  const packWidth = Math.max(900, Math.ceil(Math.sqrt((model.nodes.length || 1) * (NODE_WIDTH + 96) * (NODE_HEIGHT + 72) * 1.7)));
  let cursorX = 24, cursorY = 24, rowHeight = 0, width = 0;
  for (const component of components) {
    const remaining = new Map(component.map((id) => [id, (parents.get(id) ?? []).length]));
    const levels = new Map<string, number>();
    const queue = component.filter((id) => remaining.get(id) === 0);
    for (const id of queue) levels.set(id, 0);
    for (let i = 0; i < queue.length; i++) {
      const id = queue[i];
      for (const edge of model.edges) if (edge.from === id && remaining.has(edge.to)) {
        levels.set(edge.to, Math.max(levels.get(edge.to) ?? 0, (levels.get(id) ?? 0) + 1));
        const count = remaining.get(edge.to)! - 1; remaining.set(edge.to, count);
        if (count === 0) queue.push(edge.to);
      }
    }
    // Cycles get a bounded side-by-side presentation, retaining the actual edges.
    for (const id of component) if (!levels.has(id) || !queue.includes(id)) levels.set(id, 0);
    const rows = new Map<number, number>();
    const positions = component.map((id) => { const level = levels.get(id) ?? 0; const row = rows.get(level) ?? 0; rows.set(level, row + 1); return { id, level, row }; });
    const blockWidth = (Math.max(...positions.map((p) => p.level)) + 1) * (NODE_WIDTH + 72);
    const blockHeight = Math.max(...rows.values()) * (NODE_HEIGHT + 36);
    if (cursorX > 24 && cursorX + blockWidth > packWidth) { cursorX = 24; cursorY += rowHeight + 36; rowHeight = 0; }
    for (const p of positions) result.push({ ...byId.get(p.id)!, x: cursorX + p.level * (NODE_WIDTH + 72), y: cursorY + p.row * (NODE_HEIGHT + 36) });
    width = Math.max(width, cursorX + blockWidth); cursorX += blockWidth + 24; rowHeight = Math.max(rowHeight, blockHeight);
  }
  return { nodes: result, edges: model.edges.filter((e) => byId.has(e.from) && byId.has(e.to)), width: Math.max(360, width + 24), height: Math.max(240, cursorY + rowHeight + 24) };
}

