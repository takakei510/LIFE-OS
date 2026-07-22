import "server-only";

import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";

import { getServerEnv, getOptionalServerEnv } from "@/lib/env";
import { getNotionClient } from "@/lib/notion/client";

type CreateTextLogRecord = {
  requestId: string;
  name: string;
  memo: string;
  location: string;
  loggedAt: string;
  logTypes: string[];
};

function pageResult(value: unknown): PageObjectResponse | null {
  return value && typeof value === "object" && "object" in value && value.object === "page"
    ? (value as PageObjectResponse)
    : null;
}

export async function findAdventureLogByRequestId(requestId: string): Promise<PageObjectResponse | null> {
  const notion = getNotionClient();
  const dataSourceId = getOptionalServerEnv().NOTION_ADVENTURE_LOGS_DATA_SOURCE_ID;
  if (!notion || !dataSourceId) return null;

  const response = await notion.dataSources.query({
    data_source_id: dataSourceId,
    page_size: 1,
    filter: {
      property: "Request ID",
      rich_text: { equals: requestId },
    },
  });

  return pageResult(response.results[0]);
}

async function findPlayerPageId(): Promise<string> {
  const notion = getNotionClient();
  const env = getServerEnv();
  if (!notion || !env) throw new Error("Notion is not configured.");

  const response = await notion.dataSources.query({
    data_source_id: env.NOTION_STATUS_DATA_SOURCE_ID,
    page_size: 1,
    filter: {
      property: "Name",
      title: { equals: "PLAYER" },
    },
  });
  const player = pageResult(response.results[0]);
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
      "Request ID": { type: "rich_text", rich_text: [{ type: "text", text: { content: record.requestId } }] },
    },
  });

  const page = pageResult(created);
  if (!page) throw new Error("Adventure Log page could not be created.");
  return page;
}
