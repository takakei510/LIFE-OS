import "server-only";

import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import { unstable_noStore as noStore } from "next/cache";

import { getOptionalServerEnv, getServerEnv } from "@/lib/env";
import { getNotionClient } from "@/lib/notion/client";
import {
  checkbox,
  date,
  files,
  formulaNumber,
  formulaString,
  multiSelect,
  number,
  richText,
  rollupNumber,
  select,
  status,
  title,
} from "@/lib/notion/properties";
import type {
  Achievement,
  AdventureLog,
  LifeOsSnapshot,
  PlayerStatus,
  Quest,
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

function achievement(page: PageObjectResponse): Achievement {
  const p = page.properties;
  return {
    id: page.id,
    name: title(p, "Name"),
    category: select(p, "Category"),
    domains: multiSelect(p, "Domain"),
    tier: select(p, "Tier"),
    xp: number(p, "XP"),
    requirement: richText(p, "Requirement"),
    flavorText: richText(p, "Flavor Text"),
    unlocked: checkbox(p, "Unlocked"),
    unlockedAt: date(p, "Unlocked At"),
    visibility: select(p, "Visibility"),
    url: page.url,
  };
}

function quest(page: PageObjectResponse): Quest {
  const p = page.properties;
  return {
    id: page.id,
    name: title(p, "Name"),
    category: select(p, "Category"),
    questType: select(p, "Quest Type"),
    state: status(p, "State") ?? select(p, "State"),
    rewardXp: number(p, "Reward XP"),
    description: richText(p, "Description"),
    completionCondition: richText(p, "Completion Condition"),
    completedAt: date(p, "Completed At"),
    url: page.url,
  };
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

function adventureLog(page: PageObjectResponse): AdventureLog {
  const p = page.properties;
  return {
    id: page.id,
    name: title(p, "Name"),
    loggedAt: date(p, "Logged At"),
    memo: richText(p, "Memo"),
    location: richText(p, "Location"),
    logTypes: multiSelect(p, "Log Type"),
    visibility: select(p, "Visibility"),
    favorite: checkbox(p, "Favorite"),
    media: files(p, "Media"),
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
    const optionalEnv = getOptionalServerEnv();
    const [achievementPages, titlePages, questPages, statusPages, adventureLogPages] = await Promise.all([
      queryAll(env.NOTION_ACHIEVEMENTS_DATA_SOURCE_ID),
      queryAll(env.NOTION_TITLES_DATA_SOURCE_ID),
      queryAll(env.NOTION_QUESTS_DATA_SOURCE_ID),
      queryAll(env.NOTION_STATUS_DATA_SOURCE_ID),
      optionalEnv.NOTION_ADVENTURE_LOGS_DATA_SOURCE_ID
        ? queryAll(optionalEnv.NOTION_ADVENTURE_LOGS_DATA_SOURCE_ID)
        : Promise.resolve([]),
    ]);

    return {
      achievements: achievementPages.map(achievement),
      titles: titlePages.map(gameTitle),
      quests: questPages.map(quest),
      adventureLogs: adventureLogPages
        .map(adventureLog)
        .filter((log) => log.name.length > 0)
        .sort((a, b) => Date.parse(b.loggedAt ?? "") - Date.parse(a.loggedAt ?? "")),
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
