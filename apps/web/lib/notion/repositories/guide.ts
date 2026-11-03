import "server-only";
import { getServerEnv } from "@/lib/env";
import { getNotionClient } from "@/lib/notion/client";
import { checkbox, multiSelect, richText, select, title } from "@/lib/notion/properties";
import { parseMetadata, type Candidate } from "@/lib/life-os/guide/catalog";
import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";

// Read only the two catalog databases. Personal logs and player records are never loaded.
export async function readGuideCatalog(): Promise<Candidate[]> {
  const notion = getNotionClient(), env = getServerEnv();
  if (!notion || !env) throw new Error("Catalog unavailable");
  const result: Candidate[] = [];
  for (const kind of ["achievement", "quest"] as const) {
    let cursor: string | undefined;
    do {
      const response = await notion.dataSources.query({ data_source_id: kind === "achievement" ? env.NOTION_ACHIEVEMENTS_DATA_SOURCE_ID : env.NOTION_QUESTS_DATA_SOURCE_ID, page_size: 100, start_cursor: cursor,
        filter: { property: "Lifecycle", select: { equals: "Active" } } });
      for (const raw of response.results) {
        if (!("properties" in raw)) continue;
        const page = raw as PageObjectResponse, p = page.properties;
        if (kind === "achievement" && (select(p, "Visibility") !== "Visible" || checkbox(p, "Unlocked"))) continue;
        if (kind === "quest" && select(p, "State") !== "Available") continue;
        const metadata = richText(p, kind === "achievement" ? "Notes" : "Description");
        const relation = p["Related Achievements"];
        const relatedIds = kind === "quest" && relation?.type === "relation" ? relation.relation.map(r => r.id) : [];
        const name = title(p, "Name"), condition = richText(p, kind === "achievement" ? "Requirement" : "Completion Condition");
        if (!name || !condition || name.length > 120 || condition.length > 1000) continue;
        result.push({ id: page.id, kind, name, condition, category: select(p, "Category") ?? "", domains: multiSelect(p, "Domain"), relatedIds, ...parseMetadata(metadata) });
      }
      cursor = response.has_more ? response.next_cursor ?? undefined : undefined;
    } while (cursor);
  }
  return result;
}
