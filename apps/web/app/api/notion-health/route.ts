import { NextResponse } from "next/server";

import { getMissingServerEnvKeys } from "@/lib/env";
import { getLifeOsSnapshot } from "@/lib/notion/snapshot";

export const dynamic = "force-dynamic";

export async function GET() {
  const missing = getMissingServerEnvKeys();
  if (missing.length > 0) {
    return NextResponse.json(
      {
        ok: false,
        source: "fallback",
        missing,
      },
      { status: 503 },
    );
  }

  const snapshot = await getLifeOsSnapshot();
  const ok = snapshot.source === "notion";

  return NextResponse.json(
    {
      ok,
      source: snapshot.source,
      counts: {
        achievements: snapshot.achievements.length,
        titles: snapshot.titles.length,
        quests: snapshot.quests.length,
        players: snapshot.player ? 1 : 0,
      },
      warning: snapshot.warning,
    },
    { status: ok ? 200 : 502 },
  );
}
