import "server-only";

const REQUIRED_KEYS = [
  "NOTION_TOKEN",
  "NOTION_ACHIEVEMENTS_DATA_SOURCE_ID",
  "NOTION_TITLES_DATA_SOURCE_ID",
  "NOTION_QUESTS_DATA_SOURCE_ID",
  "NOTION_STATUS_DATA_SOURCE_ID",
] as const;

const OPTIONAL_KEYS = ["NOTION_ADVENTURE_LOGS_DATA_SOURCE_ID"] as const;

type RequiredKey = (typeof REQUIRED_KEYS)[number];
type OptionalKey = (typeof OPTIONAL_KEYS)[number];

export type ServerEnv = Record<RequiredKey, string>;
export type OptionalServerEnv = Partial<Record<OptionalKey, string>>;

export function getServerEnv(): ServerEnv | null {
  const values = Object.fromEntries(
    REQUIRED_KEYS.map((key) => [key, process.env[key]?.trim() ?? ""]),
  ) as ServerEnv;

  return REQUIRED_KEYS.every((key) => values[key].length > 0) ? values : null;
}

export function getOptionalServerEnv(): OptionalServerEnv {
  return Object.fromEntries(
    OPTIONAL_KEYS.flatMap((key) => {
      const value = process.env[key]?.trim();
      return value ? [[key, value]] : [];
    }),
  ) as OptionalServerEnv;
}

export function getMissingServerEnvKeys(): RequiredKey[] {
  return REQUIRED_KEYS.filter((key) => !process.env[key]?.trim());
}
