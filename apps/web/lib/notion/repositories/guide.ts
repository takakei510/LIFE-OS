import "server-only";
import { getServerEnv } from "@/lib/env";
import { getNotionClient } from "@/lib/notion/client";
import { checkbox, multiSelect, richText, select, title } from "@/lib/notion/properties";
import { parseMetadata, type Candidate } from "@/lib/life-os/guide/catalog";
import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import { buildTreeModel, treeId } from "@/lib/life-os/achievement-tree/model";
import { readAchievementTreeRecords } from "./achievement-tree";

// Read only the two catalog databases. Personal logs and player records are never loaded.
export async function readGuideCatalog(): Promise<Candidate[]> {
  const notion = getNotionClient(), env = getServerEnv();
  if (!notion || !env) throw new Error("Catalog unavailable");
  const tree = buildTreeModel(await readAchievementTreeRecords(), true);
  const available = new Set(tree.nodes.filter(node => node.state === "available").map(node => treeId(node.id)));
  const result: Candidate[] = [];
  for (const kind of ["achievement", "quest"] as const) {
    let cursor: string | undefined;
    const cursors = new Set<string>();
    do {
      const response = await notion.dataSources.query({ data_source_id: kind === "achievement" ? env.NOTION_ACHIEVEMENTS_DATA_SOURCE_ID : env.NOTION_QUESTS_DATA_SOURCE_ID, page_size: 100, start_cursor: cursor,
        filter: { property: "Lifecycle", select: { equals: "Active" } } });
      for (const raw of response.results) {
        if (!("properties" in raw)) continue;
        const page = raw as PageObjectResponse, p = page.properties;
        if (page.archived || page.in_trash || select(p, "Lifecycle") !== "Active") continue;
        if (kind === "achievement" && (select(p, "Visibility") !== "Visible" || checkbox(p, "Unlocked") || !available.has(treeId(page.id)))) continue;
        if (kind === "quest" && select(p, "State") !== "Available") continue;
        const metadata = richText(p, kind === "achievement" ? "Notes" : "Description");
        const relation = p["Related Achievements"];
        const relatedIds = kind === "quest" && relation?.type === "relation" ? relation.relation.map(r => r.id).filter(id => available.has(treeId(id))) : [];
        const name = title(p, "Name"), condition = richText(p, kind === "achievement" ? "Requirement" : "Completion Condition");
        if (!name || !condition || name.length > 120 || condition.length > 1000) continue;
        result.push({ id: page.id, kind, name, condition, category: select(p, "Category") ?? "", domains: multiSelect(p, "Domain"), relatedIds, ...parseMetadata(metadata) });
      }
      cursor = response.has_more ? response.next_cursor ?? undefined : undefined;
      if (response.has_more && (!cursor || cursors.has(cursor))) throw new Error("Catalog pagination incomplete");
      if (cursor) cursors.add(cursor);
    } while (cursor);
  }
  return result;
}
