import "server-only";
import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import { getServerEnv } from "@/lib/env";
import { getNotionClient } from "@/lib/notion/client";
import { date, number, richText, select, title } from "@/lib/notion/properties";
import { canAcceptQuest, isOwnedActiveQuest } from "@/lib/life-os/quests/policy";
import type { QuestRecord } from "@/lib/life-os/quests/policy";
import type { QuestRepository } from "@/lib/life-os/quests/service";
import type { Quest } from "@/lib/notion/types";

function isPage(value: unknown): value is PageObjectResponse {
  return Boolean(value && typeof value === "object" && "object" in value && value.object === "page" && "properties" in value);
}

function record(page: PageObjectResponse): QuestRecord {
  const p = page.properties;
  const player = p.Player;
  return {
    id: page.id,
    dataSourceId: page.parent.type === "data_source_id" ? page.parent.data_source_id : null,
    playerIds: player?.type === "relation" && !("has_more" in player && player.has_more) ? player.relation.map((item) => item.id) : [],
    lifecycle: select(p, "Lifecycle"), archived: page.archived || page.in_trash,
    state: p.State?.type === "select" ? select(p, "State") : null,
    revision: page.last_edited_time, completedAt: date(p, "Completed At"),
    availableFrom: date(p, "Available From"), dueAt: date(p, "Due At"),
  };
}

async function context() {
  const notion = getNotionClient();
  const env = getServerEnv();
  if (!notion || !env) throw new Error("Notionが設定されていません。");
  const players = await notion.dataSources.query({ data_source_id: env.NOTION_STATUS_DATA_SOURCE_ID, page_size: 2, filter: { property: "Name", title: { equals: "PLAYER" } } });
  if (players.has_more || players.results.length !== 1 || !isPage(players.results[0]) || players.results[0].archived || players.results[0].in_trash) throw new Error("PLAYERを一意に確認できません。");
  return { notion, dataSourceId: env.NOTION_QUESTS_DATA_SOURCE_ID, playerId: players.results[0].id };
}

export async function readQuests(): Promise<Quest[]> {
  const { notion, dataSourceId, playerId } = await context();
  const pages: PageObjectResponse[] = [];
  let cursor: string | undefined;
  do {
    const response = await notion.dataSources.query({ data_source_id: dataSourceId, page_size: 100, start_cursor: cursor,
      filter: { and: [{ property: "Lifecycle", select: { equals: "Active" } }, { property: "Player", relation: { contains: playerId } }] },
    });
    pages.push(...response.results.filter(isPage));
    cursor = response.has_more ? response.next_cursor ?? undefined : undefined;
  } while (cursor);
  const now = Date.now();
  return pages.flatMap((page) => {
    const r = record(page);
    if (!isOwnedActiveQuest(r, dataSourceId, playerId)) return [];
    const p = page.properties;
    return [{ id: page.id, name: title(p, "Name"), category: select(p, "Category"), questType: select(p, "Quest Type"),
      state: r.state, rewardXp: number(p, "Reward XP"), description: richText(p, "Description"),
      completionCondition: richText(p, "Completion Condition"), completedAt: r.completedAt, url: page.url,
      revision: r.revision, canAccept: r.state === "Available" && !r.completedAt && canAcceptQuest(r, now),
      canRelease: r.state === "Accepted" && !r.completedAt,
    }];
  });
}

export const questRepository: QuestRepository = {
  async readContext(id) {
    const { notion, dataSourceId, playerId } = await context();
    const page = await notion.pages.retrieve({ page_id: id });
    if (!isPage(page)) throw new Error("クエストが見つかりません。");
    return { record: record(page), dataSourceId, playerId };
  },
  async setState(id, state) {
    const notion = getNotionClient();
    if (!notion) throw new Error("Notionが設定されていません。");
    await notion.pages.update({ page_id: id, properties: { State: { type: "select", select: { name: state } } } });
  },
};
