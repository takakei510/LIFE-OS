import "server-only";
import { list, put } from "@vercel/blob";
import { evaluateClusters, parseClusterRules } from "@/lib/life-os/achievement-tree/cluster-policy";
import type { TreeRecord } from "@/lib/life-os/achievement-tree/model";
import { getServerEnv } from "@/lib/env";
import { getNotionClient } from "@/lib/notion/client";

async function playerPrefix() {
  const notion = getNotionClient();
  const env = getServerEnv();
  if (!notion || !env || !process.env.BLOB_READ_WRITE_TOKEN) throw new Error("Cluster discovery storage unavailable");
  const players = await notion.dataSources.query({
    data_source_id: env.NOTION_STATUS_DATA_SOURCE_ID,
    page_size: 2,
    filter: { property: "Name", title: { equals: "PLAYER" } },
  });
  const [player] = players.results;
  if (players.has_more || players.results.length !== 1 || !player || player.object !== "page" || !("properties" in player) || player.archived || player.in_trash
    || player.parent.type !== "data_source_id" || player.parent.data_source_id.replaceAll("-", "").toLowerCase() !== env.NOTION_STATUS_DATA_SOURCE_ID.replaceAll("-", "").toLowerCase()) {
    throw new Error("Cluster discovery requires one active PLAYER");
  }
  return `life-os-cluster-discoveries/${player.id.replaceAll("-", "").toLowerCase()}/`;
}

export async function resolveClusterAccess(records: TreeRecord[], persist = false) {
  const config = process.env.LIFE_OS_CLUSTER_RULES?.trim();
  if (!config) return { records, canDiscover: false, clusters: [] };
  const rules = parseClusterRules(config);
  const discovered = new Set<string>();
  try {
    const prefix = await playerPrefix();
    const load = async () => {
      let cursor: string | undefined;
      const cursors = new Set<string>();
      do {
        const page = await list({ prefix, cursor, limit: 100 });
        const paths = new Set(page.blobs.map(blob => blob.pathname));
        for (const cluster of rules.clusters) if (paths.has(`${prefix}${cluster.id}.json`)) discovered.add(cluster.id);
        cursor = page.hasMore ? page.cursor : undefined;
        if (page.hasMore && (!cursor || cursors.has(cursor))) throw new Error("Incomplete discovery listing");
        if (cursor) cursors.add(cursor);
      } while (cursor);
    };
    await load();
    if (persist) {
      const { eligible } = evaluateClusters(records, rules, discovered);
      for (const cluster of eligible) {
        try {
          await put(`${prefix}${cluster.id}.json`, JSON.stringify({
            clusterId: cluster.id,
            discoveredAt: new Date().toISOString(),
            sets: cluster.requires,
          }), { access: "private", addRandomSuffix: false, allowOverwrite: false, contentType: "application/json", cacheControlMaxAge: 60 });
          discovered.add(cluster.id);
        } catch {
          // Another request may have saved the same discovery first.
          await load();
          if (!discovered.has(cluster.id)) throw new Error("Could not save cluster discovery");
        }
      }
    }
  } catch (error) {
    if (persist) throw error;
    // A failed read must not reveal undiscovered content.
    discovered.clear();
    const hidden = evaluateClusters(records, rules, discovered);
    return { records: hidden.records, canDiscover: false, clusters: [] };
  }
  const access = evaluateClusters(records, rules, discovered);
  return {
    records: access.records,
    canDiscover: access.eligible.length > 0,
    clusters: access.discovered.map(({ id, name, roots }) => ({ id, name, roots })),
  };
}
