import "server-only";

import { Client } from "@notionhq/client";

import { getServerEnv } from "@/lib/env";

let client: Client | null = null;

export function getNotionClient(): Client | null {
  const env = getServerEnv();
  if (!env) return null;

  client ??= new Client({
    auth: env.NOTION_TOKEN,
    notionVersion: "2026-03-11",
  });

  return client;
}
