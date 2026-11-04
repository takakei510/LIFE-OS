import { NextResponse } from "next/server";
import { getServerEnv } from "@/lib/env";
import { getNotionClient } from "@/lib/notion/client";

export const dynamic = "force-dynamic";

// Read-only deployment audit behind the same Vercel Authentication boundary.
export async function GET() {
  if (process.env.QUEST_COMPLETION_ENABLED !== "true") return NextResponse.json({ enabled: false }, { status: 404 });
  const notion = getNotionClient();
  const env = getServerEnv();
  if (!notion || !env) return NextResponse.json({ ok: false }, { status: 503 });
  try {
    const [quests, player] = await Promise.all([
      notion.dataSources.retrieve({ data_source_id: env.NOTION_QUESTS_DATA_SOURCE_ID }),
      notion.dataSources.retrieve({ data_source_id: env.NOTION_STATUS_DATA_SOURCE_ID }),
    ]);
    if (!("properties" in quests) || !("properties" in player)) throw new Error("Incomplete schema");
    const q = quests.properties;
    const p = player.properties;
    return NextResponse.json({
      ok: true, coordinationConfigured: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
      quest: {
        state: q.State?.type,
        earnedXp: q["Earned XP"]?.type === "formula" ? q["Earned XP"].formula.expression : null,
        isCompleted: q["Is Completed"]?.type === "formula" ? q["Is Completed"].formula.expression : null,
      },
      player: {
        totalXp: p["Total XP"]?.type === "formula" ? p["Total XP"].formula.expression : null,
        questXp: p["Quest XP"]?.type === "rollup" ? p["Quest XP"].rollup : null,
        achievementXp: p["Achievement XP"]?.type === "rollup" ? p["Achievement XP"].rollup : null,
        completedQuests: p["Completed Quests"]?.type === "rollup" ? p["Completed Quests"].rollup : null,
      },
    }, { headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ ok: false }, { status: 502, headers: { "Cache-Control": "no-store" } }); }
}
