import "server-only";

import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";

import { getOptionalServerEnv } from "@/lib/env";
import { getNotionClient } from "@/lib/notion/client";
import {
  checkbox,
  date,
  files,
  multiSelect,
  richText,
  select,
  title,
} from "@/lib/notion/properties";
import type { AdventureLog } from "@/lib/notion/types";

function isPage(result: unknown): result is PageObjectResponse {
  return Boolean(
    result
      && typeof result === "object"
      && "object" in result
      && result.object === "page"
      && "properties" in result,
  );
}

function mapAdventureLog(page: PageObjectResponse): AdventureLog {
  const properties = page.properties;
  return {
    id: page.id,
    name: title(properties, "Name"),
    loggedAt: date(properties, "Logged At"),
    memo: richText(properties, "Memo"),
    location: richText(properties, "Location"),
    logTypes: multiSelect(properties, "Log Type"),
    visibility: select(properties, "Visibility"),
    lifecycle: select(properties, "Lifecycle"),
    favorite: checkbox(properties, "Favorite"),
    media: files(properties, "Media"),
    url: page.url,
  };
}

export async function readAdventureLogs(): Promise<AdventureLog[]> {
  const notion = getNotionClient();
  const dataSourceId = getOptionalServerEnv().NOTION_ADVENTURE_LOGS_DATA_SOURCE_ID;
  if (!notion || !dataSourceId) return [];

  const pages: PageObjectResponse[] = [];
  let cursor: string | undefined;

  do {
    const response = await notion.dataSources.query({
      data_source_id: dataSourceId,
      page_size: 100,
      start_cursor: cursor,
    });
    pages.push(...response.results.filter(isPage));
    cursor = response.has_more ? (response.next_cursor ?? undefined) : undefined;
  } while (cursor);

  return pages
    .map(mapAdventureLog)
    .filter((log) => log.name.length > 0 && log.lifecycle !== "Archived")
    .sort((a, b) => Date.parse(b.loggedAt ?? "") - Date.parse(a.loggedAt ?? ""));
}
