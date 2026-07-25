import "server-only";

import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";

import { getServerEnv } from "@/lib/env";
import { getNotionClient } from "@/lib/notion/client";

function pageResult(value: unknown): PageObjectResponse | null {
  return value && typeof value === "object" && "object" in value && value.object === "page"
    ? (value as PageObjectResponse)
    : null;
}

export async function unlockAchievementPage(pageId: string, unlockedAt: string): Promise<PageObjectResponse> {
  const notion = getNotionClient();
  const env = getServerEnv();
  if (!notion || !env) throw new Error("Notion is not configured.");

  const page = await notion.pages.retrieve({ page_id: pageId });
  const current = pageResult(page);
  if (!current || current.parent.type !== "data_source_id" || current.parent.data_source_id !== env.NOTION_ACHIEVEMENTS_DATA_SOURCE_ID) {
    throw new Error("Achievement was not found in the configured data source.");
  }

  const unlocked = current.properties.Unlocked;
  if (unlocked?.type === "checkbox" && unlocked.checkbox) return current;

  const updated = await notion.pages.update({
    page_id: pageId,
    properties: {
      Unlocked: { type: "checkbox", checkbox: true },
      "Unlocked At": { type: "date", date: { start: unlockedAt } },
    },
  });

  const result = pageResult(updated);
  if (!result) throw new Error("Achievement could not be unlocked.");
  return result;
}
