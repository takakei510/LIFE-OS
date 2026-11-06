import type { TreeEdge, TreeModel, TreeNode } from "./model";

export const NODE_WIDTH = 192;
export const NODE_HEIGHT = 124;
const GAP = 48;
const SPACING = Math.hypot(NODE_WIDTH, NODE_HEIGHT) + GAP;
export type PositionedNode = TreeNode & { x: number; y: number; depth: number; isRoot: boolean };
export type MapCluster = { id: string; x: number; y: number; radius: number; count: number; roots: number };
export type RadialLayout = { nodes: PositionedNode[]; edges: TreeEdge[]; clusters: MapCluster[]; width: number; height: number };

/** Layout consumes only the safe public graph; it never decides unlock rules.
 * A connected component may contain several roots and shared descendants.
 * Shared nodes are placed once, with every actual prerequisite edge retained.
 */
export function layoutTree(model: TreeModel): RadialLayout {
  const byId = new Map(model.nodes.map(node => [node.id, node]));
  const ids = [...byId.keys()].sort();
  const edges = model.edges.filter(edge => byId.has(edge.from) && byId.has(edge.to));
  const adjacent = new Map(ids.map(id => [id, new Set<string>()]));
  const children = new Map(ids.map(id => [id, new Set<string>()]));
  const parents = new Map(ids.map(id => [id, new Set<string>()]));
  for (const edge of edges) {
    adjacent.get(edge.from)!.add(edge.to);
    adjacent.get(edge.to)!.add(edge.from);
    children.get(edge.from)!.add(edge.to);
    parents.get(edge.to)!.add(edge.from);
  }
  const seen = new Set<string>();
  const components: string[][] = [];
  for (const id of ids) {
    if (seen.has(id)) continue;
    const component = [id];
    seen.add(id);
    for (let i = 0; i < component.length; i++) {
      for (const next of [...adjacent.get(component[i])!].sort()) {
        if (!seen.has(next)) { seen.add(next); component.push(next); }
      }
    }
    components.push(component.sort());
  }

  const local = components.map(component => {
    const remaining = new Map(component.map(id => [id, parents.get(id)!.size]));
    const queue = component.filter(id => remaining.get(id) === 0);
    const levels = new Map(queue.map(id => [id, 0]));
    const processed = new Set<string>();
    for (let i = 0; i < queue.length; i++) {
      const id = queue[i];
      processed.add(id);
      for (const child of [...children.get(id)!].sort()) {
        levels.set(child, Math.max(levels.get(child) ?? 0, levels.get(id)! + 1));
        const count = remaining.get(child)! - 1;
        remaining.set(child, count);
        if (count === 0) queue.push(child);
      }
    }
    // Review-only cyclic records still get a bounded, non-recursive layout.
    const lastLevel = Math.max(0, ...levels.values());
    for (const id of component) if (!processed.has(id)) levels.set(id, lastLevel + 1);
    const rings = new Map<number, string[]>();
    for (const id of component) {
      const depth = levels.get(id)!;
      rings.set(depth, [...(rings.get(depth) ?? []), id]);
    }
    const points: PositionedNode[] = [];
    let radius = -SPACING;
    for (const [depth, ring] of [...rings].sort(([a], [b]) => a - b)) {
      // Chord length, rather than arc length, bounds rectangular collisions.
      const ringRadius = ring.length === 1 ? 0 : SPACING / (2 * Math.sin(Math.PI / ring.length));
      radius = Math.max(radius + SPACING, ringRadius);
      for (let i = 0; i < ring.length; i++) {
        const id = ring[i];
        const angle = -Math.PI / 2 + i * Math.PI * 2 / ring.length;
        points.push({ ...byId.get(id)!, x: Math.cos(angle) * radius - NODE_WIDTH / 2,
          y: Math.sin(angle) * radius - NODE_HEIGHT / 2, depth,
          isRoot: parents.get(id)!.size === 0 && byId.get(id)!.prerequisiteCount === 0 && byId.get(id)!.state !== "review" });
      }
    }
    return { id: component[0], points, radius: radius + Math.hypot(NODE_WIDTH, NODE_HEIGHT) / 2 + 24 };
  });

  // Independent clusters spread around the origin, rather than around a fake
  // global achievement. Circles bound their labels; edges may cross naturally.
  local.sort((a, b) => b.radius - a.radius || a.id.localeCompare(b.id));
  const clusters: MapCluster[] = [];
  const positioned: PositionedNode[] = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  let candidate = 0;
  for (const cluster of local) {
    let x = 0, y = 0;
    if (clusters.length) candidate = Math.max(candidate, Math.ceil(((clusters[0].radius + cluster.radius + GAP) / SPACING) ** 2));
    while (true) {
      const distance = Math.sqrt(candidate) * SPACING;
      const angle = candidate * goldenAngle;
      x = Math.cos(angle) * distance; y = Math.sin(angle) * distance;
      candidate++;
      if (clusters.every(other => Math.hypot(x - other.x, y - other.y) >= cluster.radius + other.radius + GAP)) break;
    }
    clusters.push({ id: cluster.id, x, y, radius: cluster.radius, count: cluster.points.length, roots: cluster.points.filter(node => node.isRoot).length });
    positioned.push(...cluster.points.map(node => ({ ...node, x: node.x + x, y: node.y + y })));
  }
  const left = Math.min(0, ...clusters.map(cluster => cluster.x - cluster.radius)) - 24;
  const top = Math.min(0, ...clusters.map(cluster => cluster.y - cluster.radius)) - 24;
  const right = Math.max(0, ...clusters.map(cluster => cluster.x + cluster.radius)) + 24;
  const bottom = Math.max(0, ...clusters.map(cluster => cluster.y + cluster.radius)) + 24;
  return { nodes: positioned.map(node => ({ ...node, x: node.x - left, y: node.y - top })), edges,
    clusters: clusters.map(cluster => ({ ...cluster, x: cluster.x - left, y: cluster.y - top })),
    width: Math.max(360, right - left), height: Math.max(240, bottom - top) };
}

/** Clip a radial connection at both card boundaries, in any direction. */
export function edgePath(from: PositionedNode, to: PositionedNode): string {
  const x1 = from.x + NODE_WIDTH / 2, y1 = from.y + NODE_HEIGHT / 2;
  const x2 = to.x + NODE_WIDTH / 2, y2 = to.y + NODE_HEIGHT / 2;
  const dx = x2 - x1, dy = y2 - y1;
  if (!dx && !dy) return `M${x1},${y1 - NODE_HEIGHT / 2} c-60,-70 60,-70 0,0`;
  const fraction = Math.min(dx ? NODE_WIDTH / 2 / Math.abs(dx) : Infinity, dy ? NODE_HEIGHT / 2 / Math.abs(dy) : Infinity);
  return `M${x1 + dx * fraction},${y1 + dy * fraction} L${x2 - dx * fraction},${y2 - dy * fraction}`;
}
