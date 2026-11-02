import { getOptionalServerEnv } from "@/lib/env";
import { getNotionClient } from "@/lib/notion/client";

export const dynamic = "force-dynamic";
export async function GET() {
  const notion = getNotionClient();
  const dataSourceId = getOptionalServerEnv().NOTION_ADVENTURE_LOGS_DATA_SOURCE_ID;
  if (!notion || !dataSourceId) return Response.json({ ok: false, configured: false }, { status: 503 });
  try {
    const source = await notion.dataSources.retrieve({ data_source_id: dataSourceId });
    const expected: Record<string, string> = { Name: "title", Memo: "rich_text", Location: "rich_text", "Logged At": "date", "Log Type": "multi_select", Visibility: "select", Lifecycle: "select", Favorite: "checkbox", Player: "relation", "Related Achievement": "relation", "Request ID": "rich_text", Media: "files" };
    const invalid = Object.entries(expected).filter(([name, type]) => source.properties[name]?.type !== type).map(([name]) => name);
    return Response.json({ ok: invalid.length === 0, configured: true, invalidProperties: invalid, photoUploadsEnabled: process.env.PHOTO_UPLOADS_ENABLED === "true", stagingConfigured: Boolean(process.env.BLOB_READ_WRITE_TOKEN), cleanupConfigured: Boolean(process.env.CRON_SECRET) }, { status: invalid.length ? 503 : 200, headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ ok: false, configured: true, message: "Adventure Logsへの接続・権限を確認してください。" }, { status: 502 });
  }
}
