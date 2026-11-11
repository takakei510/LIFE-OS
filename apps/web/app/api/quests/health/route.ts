import { NextResponse } from "next/server";
import { getQuestRewardHealth } from "@/lib/notion/repositories/quests";

export const dynamic = "force-dynamic";

// Read-only deployment audit behind the same Vercel Authentication boundary.
export async function GET() {
  if (process.env.QUEST_COMPLETION_ENABLED !== "true") return NextResponse.json({ enabled: false }, { status: 404 });
  try {
    const health = await getQuestRewardHealth();
    const coordinationConfigured = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
    return NextResponse.json({ ...health, coordinationConfigured }, { status: health.ok && coordinationConfigured ? 200 : 503, headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ ok: false }, { status: 502, headers: { "Cache-Control": "no-store" } }); }
}
