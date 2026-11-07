import "server-only";
import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import { getNotionClient } from "@/lib/notion/client";
import { getServerEnv } from "@/lib/env";
import { checkbox, date, multiSelect, number, richText, select, title } from "@/lib/notion/properties";
import type { TreeRecord } from "@/lib/life-os/achievement-tree/model";

const isPage = (value: unknown): value is PageObjectResponse => Boolean(value && typeof value === "object" && "object" in value && value.object === "page" && "properties" in value);

export async function readAchievementTreeRecords(): Promise<TreeRecord[]> {
  const notion = getNotionClient(); const env = getServerEnv();
  if (!notion || !env) throw new Error("Notion is not configured.");
  const pages: PageObjectResponse[] = [];
  let cursor: string | undefined;
  const cursors = new Set<string>();
  do {
    const response = await notion.dataSources.query({ data_source_id: env.NOTION_ACHIEVEMENTS_DATA_SOURCE_ID, page_size: 100, start_cursor: cursor, filter: { property: "Lifecycle", select: { equals: "Active" } } });
    pages.push(...response.results.filter(isPage));
    cursor = response.has_more ? response.next_cursor ?? undefined : undefined;
    if (response.has_more && (!cursor || cursors.has(cursor))) throw new Error("Incomplete achievement pages.");
    if (cursor) cursors.add(cursor);
  } while (cursor);
  const records: TreeRecord[] = [];
  for (const page of pages) {
    if (page.archived || page.in_trash || select(page.properties, "Lifecycle") !== "Active" || page.parent.type !== "data_source_id" || page.parent.data_source_id.replaceAll("-", "").toLowerCase() !== env.NOTION_ACHIEVEMENTS_DATA_SOURCE_ID.replaceAll("-", "").toLowerCase()) continue;
    const p = page.properties; const relation = p.Prerequisites;
    let complete = relation?.type === "relation";
    let prerequisites = relation?.type === "relation" ? relation.relation.map((item) => item.id) : [];
    if (relation?.type === "relation" && "has_more" in relation && relation.has_more) {
      const ids: string[] = []; const seen = new Set<string>(); let next: string | undefined;
      try {
        do {
          const response = await notion.pages.properties.retrieve({ page_id: page.id, property_id: relation.id, page_size: 100, start_cursor: next });
          if (response.object !== "list") throw new Error("Incomplete prerequisite relation.");
          for (const item of response.results) { if (item.type !== "relation") throw new Error("Unexpected relation item."); ids.push(item.relation.id); }
          next = response.has_more ? response.next_cursor ?? undefined : undefined;
          if (response.has_more && (!next || seen.has(next))) throw new Error("Incomplete prerequisite cursor.");
          if (next) seen.add(next);
        } while (next);
        prerequisites = ids;
      } catch { complete = false; }
    }
    records.push({ achievement: { id: page.id, name: title(p, "Name"), category: select(p, "Category"), domains: multiSelect(p, "Domain"), tier: select(p, "Tier"), xp: number(p, "XP"), requirement: richText(p, "Requirement"), flavorText: richText(p, "Flavor Text"), unlocked: checkbox(p, "Unlocked"), unlockedAt: date(p, "Unlocked At"), visibility: select(p, "Visibility"), url: page.url }, prerequisites: [...new Set(prerequisites)], relationComplete: complete });
  }
  return records;
}

