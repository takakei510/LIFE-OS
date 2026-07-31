import "server-only";

import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";

import { getOptionalServerEnv, getServerEnv } from "@/lib/env";
import { getNotionClient } from "@/lib/notion/client";
import { checkbox, date, files, multiSelect, richText, select, title } from "@/lib/notion/properties";
import type { AdventureLog } from "@/lib/notion/types";

type CreateTextLogRecord = {
  requestId: string;
  name: string;
  memo: string;
  location: string;
  loggedAt: string;
  logTypes: string[];
  relatedAchievementId?: string;
};

function isPage(result: unknown): result is PageObjectResponse {
  return Boolean(result && typeof result === "object" && "object" in result && result.object === "page" && "properties" in result);
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
    const response = await notion.dataSources.query({ data_source_id: dataSourceId, page_size: 100, start_cursor: cursor });
    pages.push(...response.results.filter(isPage));
    cursor = response.has_more ? (response.next_cursor ?? undefined) : undefined;
  } while (cursor);

  return pages.map(mapAdventureLog).filter((log) => log.name.length > 0 && log.lifecycle !== "Archived")
    .sort((a, b) => Date.parse(b.loggedAt ?? "") - Date.parse(a.loggedAt ?? ""));
}

export async function findAdventureLogByRequestId(requestId: string): Promise<PageObjectResponse | null> {
  const notion = getNotionClient();
  const dataSourceId = getOptionalServerEnv().NOTION_ADVENTURE_LOGS_DATA_SOURCE_ID;
  if (!notion || !dataSourceId) return null;
  const response = await notion.dataSources.query({
    data_source_id: dataSourceId,
    page_size: 1,
    filter: { property: "Request ID", rich_text: { equals: requestId } },
  });
  return response.results.find(isPage) ?? null;
}

async function findPlayerPageId(): Promise<string> {
  const notion = getNotionClient();
  const env = getServerEnv();
  if (!notion || !env) throw new Error("Notion is not configured.");
  const response = await notion.dataSources.query({
    data_source_id: env.NOTION_STATUS_DATA_SOURCE_ID,
    page_size: 1,
    filter: { property: "Name", title: { equals: "PLAYER" } },
  });
  const player = response.results.find(isPage);
  if (!player) throw new Error("PLAYER record was not found.");
  return player.id;
}

export async function createTextAdventureLog(record: CreateTextLogRecord): Promise<PageObjectResponse> {
  const notion = getNotionClient();
  const dataSourceId = getOptionalServerEnv().NOTION_ADVENTURE_LOGS_DATA_SOURCE_ID;
  if (!notion || !dataSourceId) throw new Error("Adventure Logs data source is not configured.");
  const playerPageId = await findPlayerPageId();
  const created = await notion.pages.create({
    parent: { type: "data_source_id", data_source_id: dataSourceId },
    properties: {
      Name: { type: "title", title: [{ type: "text", text: { content: record.name } }] },
      "Logged At": { type: "date", date: { start: record.loggedAt } },
      Memo: { type: "rich_text", rich_text: record.memo ? [{ type: "text", text: { content: record.memo } }] : [] },
      Location: { type: "rich_text", rich_text: record.location ? [{ type: "text", text: { content: record.location } }] : [] },
      "Log Type": { type: "multi_select", multi_select: record.logTypes.map((name) => ({ name })) },
      Visibility: { type: "select", select: { name: "Private" } },
      Favorite: { type: "checkbox", checkbox: false },
      Lifecycle: { type: "select", select: { name: "Active" } },
      Player: { type: "relation", relation: [{ id: playerPageId }] },
      "Related Achievement": { type: "relation", relation: record.relatedAchievementId ? [{ id: record.relatedAchievementId }] : [] },
      "Request ID": { type: "rich_text", rich_text: [{ type: "text", text: { content: record.requestId } }] },
    },
  });
  if (!isPage(created)) throw new Error("Adventure Log page could not be created.");
  return created;
}
