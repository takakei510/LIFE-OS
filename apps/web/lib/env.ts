import "server-only";

const REQUIRED_KEYS = [
  "NOTION_TOKEN",
  "NOTION_ACHIEVEMENTS_DATA_SOURCE_ID",
  "NOTION_TITLES_DATA_SOURCE_ID",
  "NOTION_QUESTS_DATA_SOURCE_ID",
  "NOTION_STATUS_DATA_SOURCE_ID",
] as const;

type RequiredKey = (typeof REQUIRED_KEYS)[number];

export type ServerEnv = Record<RequiredKey, string>;

export function getServerEnv(): ServerEnv | null {
  const values = Object.fromEntries(
    REQUIRED_KEYS.map((key) => [key, process.env[key]?.trim() ?? ""]),
  ) as ServerEnv;

  return REQUIRED_KEYS.every((key) => values[key].length > 0) ? values : null;
}

export function getMissingServerEnvKeys(): RequiredKey[] {
  return REQUIRED_KEYS.filter((key) => !process.env[key]?.trim());
}
