import type { TreeRecord } from "./model";

type Cluster = { id: string; name: string; members: string[]; roots: string[]; requires: string[] };
export type ClusterRules = { sets: Map<string, string[]>; clusters: Cluster[] };
const id = (value: string) => value.replaceAll("-", "").toLowerCase();

function strings(value: unknown): string[] {
  if (!Array.isArray(value) || !value.length || !value.every(item => typeof item === "string" && item.trim() === item && item.length > 0)) {
    throw new Error("Invalid cluster list");
  }
  return [...new Set(value as string[])];
}

function slug(value: unknown): value is string {
  return typeof value === "string" && /^[a-z][a-z0-9-]{0,63}$/.test(value);
}

function achievementIds(value: unknown): string[] {
  const ids = strings(value).map(id);
  if (!ids.every(item => /^[a-f0-9]{32}$/.test(item))) throw new Error("Invalid cluster achievement ID");
  return [...new Set(ids)];
}

export function parseClusterRules(json: string): ClusterRules {
  const data = JSON.parse(json);
  if (!data || !Array.isArray(data.sets) || !Array.isArray(data.clusters) || data.clusters.length > 50) {
    throw new Error("Invalid cluster configuration");
  }
  const sets = new Map<string, string[]>();
  for (const set of data.sets) {
    if (!set || !slug(set.id) || !Number.isSafeInteger(set.version) || set.version < 1) throw new Error("Invalid set version");
    const key = `${set.id}@${set.version}`;
    if (sets.has(key)) throw new Error("Duplicate set version");
    sets.set(key, achievementIds(set.achievementIds));
  }
  const clusterIds = new Set<string>();
  const clusters = data.clusters.map((entry: Cluster) => {
    if (!entry || !slug(entry.id) || clusterIds.has(entry.id) || typeof entry.name !== "string" || !entry.name.trim()) {
      throw new Error("Invalid cluster identity");
    }
    const members = achievementIds(entry.members);
    const roots = achievementIds(entry.roots);
    const requires = strings(entry.requires);
    if (roots.some(root => !members.includes(root)) || requires.some(set => !sets.has(set))) {
      throw new Error("Invalid cluster reference");
    }
    clusterIds.add(entry.id);
    return { id: entry.id, name: entry.name.trim(), members, roots, requires };
  });
  return { sets, clusters };
}

/** Resolve ordinary prerequisites and undiscovered gates in the same dependency graph. */
export function evaluateClusters(records: TreeRecord[], rules: ClusterRules, discovered: ReadonlySet<string>) {
  const byId = new Map(records.map(record => [id(record.achievement.id), record]));
  const dependencies = new Map(records.filter(record => record.relationComplete).map(record => [
    id(record.achievement.id), new Set(record.prerequisites.map(id)),
  ]));
  const blocked = new Set<string>();
  const pending = rules.clusters.filter(cluster => !discovered.has(cluster.id));
  for (const cluster of pending) {
    const gate = `cluster:${cluster.id}`;
    dependencies.set(gate, new Set(cluster.requires.flatMap(set => rules.sets.get(set)!)));
    for (const member of cluster.members) {
      blocked.add(member);
      dependencies.get(member)?.add(gate);
    }
  }

  const children = new Map<string, string[]>();
  for (const [key, parents] of dependencies) {
    for (const parent of parents) {
      const entries = children.get(parent) ?? [];
      entries.push(key);
      children.set(parent, entries);
    }
  }
  const ready = [...dependencies.keys()].filter(key => dependencies.get(key)!.size === 0);
  const reachable = new Set<string>();
  for (let index = 0; index < ready.length; index++) {
    const key = ready[index];
    reachable.add(key);
    for (const child of children.get(key) ?? []) {
      const parents = dependencies.get(child)!;
      parents.delete(key);
      if (!parents.size) ready.push(child);
    }
  }

  const eligible = pending.filter(cluster => reachable.has(`cluster:${cluster.id}`)
    && cluster.members.every(member => reachable.has(member))
    && cluster.requires.every(set => rules.sets.get(set)!.every(member => byId.get(member)?.achievement.unlocked)));
  const opened = rules.clusters.filter(cluster => discovered.has(cluster.id));
  const revealed = new Set(opened.flatMap(cluster => cluster.members));
  return {
    eligible,
    records: records.flatMap(record => {
      const key = id(record.achievement.id);
      if (blocked.has(key)) return record.achievement.unlocked ? [record] : [];
      if (revealed.has(key) && record.achievement.visibility?.trim().toLowerCase() === "hidden") {
        return [{ ...record, achievement: { ...record.achievement, visibility: "Visible" } }];
      }
      return [record];
    }),
    discovered: opened,
  };
}
