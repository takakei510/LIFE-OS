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
