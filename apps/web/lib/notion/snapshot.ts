import "server-only";

import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import { unstable_noStore as noStore } from "next/cache";

import { getServerEnv } from "@/lib/env";
import { getNotionClient } from "@/lib/notion/client";
import {
  checkbox,
  formulaNumber,
  formulaString,
  richText,
  rollupNumber,
  select,
  title,
} from "@/lib/notion/properties";
import { readAchievementTreeRecords } from "@/lib/notion/repositories/achievement-tree";
import { publicTreeAchievements } from "@/lib/life-os/achievement-tree/model";
import { readQuests } from "@/lib/notion/repositories/quests";
import { readAdventureLogs } from "@/lib/notion/repositories/adventure-logs";
import type {
  LifeOsSnapshot,
  PlayerStatus,
  Title,
} from "@/lib/notion/types";

async function queryAll(dataSourceId: string): Promise<PageObjectResponse[]> {
  const notion = getNotionClient();
  if (!notion) return [];

  const pages: PageObjectResponse[] = [];
  let cursor: string | undefined;

  do {
    const response = await notion.dataSources.query({
      data_source_id: dataSourceId,
      page_size: 100,
      start_cursor: cursor,
    });

    pages.push(
      ...response.results.filter(
        (result): result is PageObjectResponse => result.object === "page" && "properties" in result,
      ),
    );
    cursor = response.has_more ? (response.next_cursor ?? undefined) : undefined;
  } while (cursor);

  return pages;
}

function gameTitle(page: PageObjectResponse): Title {
  const p = page.properties;
  return {
    id: page.id,
    name: title(p, "Name"),
    tier: select(p, "Tier"),
    description: richText(p, "Description"),
    unlocked: checkbox(p, "Unlocked"),
    equipped: checkbox(p, "Equipped"),
    url: page.url,
  };
}

function playerStatus(page: PageObjectResponse): PlayerStatus {
  const p = page.properties;
  return {
    id: page.id,
    name: title(p, "Name"),
    totalXp: formulaNumber(p, "Total XP"),
    level: formulaNumber(p, "Level"),
    nextLevelXp: formulaNumber(p, "Next Level XP"),
    progress: formulaNumber(p, "Progress"),
    playerRank: formulaString(p, "Player Rank"),
    unlockedAchievements: rollupNumber(p, "Unlocked Achievements"),
    unlockedTitles: rollupNumber(p, "Unlocked Titles"),
    completedQuests: rollupNumber(p, "Completed Quests"),
    achievementXp: p["Achievement XP"]?.type === "rollup" && p["Achievement XP"].rollup.type === "number" && typeof p["Achievement XP"].rollup.number === "number" ? p["Achievement XP"].rollup.number : null,
    questXp: p["Quest XP"]?.type === "rollup" && p["Quest XP"].rollup.type === "number" && typeof p["Quest XP"].rollup.number === "number" ? p["Quest XP"].rollup.number : null,
    url: page.url,
  };
}

export async function getLifeOsSnapshot(): Promise<LifeOsSnapshot> {
  noStore();

  const env = getServerEnv();
  if (!env) {
    return {
      achievements: [],
      quests: [],
      titles: [],
      adventureLogs: [],
      player: null,
      source: "fallback",
      warning: "Notion environment variables are not configured.",
    };
  }

  try {
    const [achievementPages, titlePages, quests, statusPages, adventureLogs] = await Promise.all([
      readAchievementTreeRecords(),
      queryAll(env.NOTION_TITLES_DATA_SOURCE_ID),
      readQuests(),
      queryAll(env.NOTION_STATUS_DATA_SOURCE_ID),
      readAdventureLogs(),
    ]);

    return {
      achievements: publicTreeAchievements(achievementPages),
      titles: titlePages.map(gameTitle),
      quests,
      adventureLogs,
      player: statusPages[0] ? playerStatus(statusPages[0]) : null,
      source: "notion",
    };
  } catch (error) {
    console.error("Failed to load LIFE OS data from Notion", error);
    return {
      achievements: [],
      quests: [],
      titles: [],
      adventureLogs: [],
      player: null,
      source: "fallback",
      warning: "Notion data could not be loaded.",
    };
  }
}
