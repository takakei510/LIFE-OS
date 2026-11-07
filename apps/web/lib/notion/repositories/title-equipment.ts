import "server-only";
import { del, put } from "@vercel/blob";
import { getServerEnv } from "@/lib/env";
import { getNotionClient } from "@/lib/notion/client";
import { planTitleEquipment, titleId } from "@/lib/life-os/title-equipment";

export async function changeTitleEquipment(id: string, operation: "equip" | "unequip", expected: string[]) {
  const notion = getNotionClient();
  const env = getServerEnv();
  if (!notion || !env || !process.env.BLOB_READ_WRITE_TOKEN) throw new Error("TITLE_EQUIPMENT_UNAVAILABLE");
  const dataSource = env.NOTION_TITLES_DATA_SOURCE_ID;
  const key = `life-os-title-equipment/${titleId(dataSource)}.json`;
  const lock = await put(key, JSON.stringify({ startedAt: new Date().toISOString() }), {
    access: "private", addRandomSuffix: false, allowOverwrite: false,
    contentType: "application/json", cacheControlMaxAge: 60,
  }).catch(() => null);
  if (!lock) throw new Error("TITLE_EQUIPMENT_BUSY");

  let retainLock = false;
  try {
    const target = await notion.pages.retrieve({ page_id: id });
    if (target.object !== "page" || !("properties" in target) || target.archived || target.in_trash
      || target.parent.type !== "data_source_id" || titleId(target.parent.data_source_id) !== titleId(dataSource)
      || target.properties.Equipped?.type !== "checkbox"
      || target.properties.Unlocked?.type !== "checkbox" || !target.properties.Unlocked.checkbox) {
      throw new Error("INVALID_TITLE");
    }

    const equipped: string[] = [];
    const cursors = new Set<string>();
    let cursor: string | undefined;
    do {
      const result = await notion.dataSources.query({
        data_source_id: dataSource, page_size: 100, start_cursor: cursor,
        filter: { property: "Equipped", checkbox: { equals: true } },
      });
      for (const page of result.results) {
        if (page.object !== "page" || !("properties" in page)) throw new Error("Incomplete title data");
        if (page.archived || page.in_trash) continue;
        if (page.parent.type !== "data_source_id" || titleId(page.parent.data_source_id) !== titleId(dataSource)
          || page.properties.Equipped?.type !== "checkbox" || !page.properties.Equipped.checkbox) {
          throw new Error("Inconsistent title data");
        }
        equipped.push(page.id);
      }
      cursor = result.has_more ? result.next_cursor ?? undefined : undefined;
      if (result.has_more && (!cursor || cursors.has(cursor))) throw new Error("Incomplete title listing");
      if (cursor) cursors.add(cursor);
    } while (cursor);
    if (target.properties.Equipped.checkbox !== equipped.some(value => titleId(value) === titleId(target.id))) {
      throw new Error("STALE_TITLE_EQUIPMENT");
    }

    for (const change of planTitleEquipment(equipped, expected, target.id, operation)) {
      // An ambiguous response may still commit. Keep the fence until the state is checked.
      retainLock = true;
      await notion.pages.update({
        page_id: change.id,
        properties: { Equipped: { type: "checkbox", checkbox: change.equipped } },
      });
      retainLock = false;
    }
  } finally {
    if (!retainLock) {
      try { await del(lock.pathname, { ifMatch: lock.etag }); }
      catch { console.error("Could not release title equipment lock"); }
    }
  }
}
