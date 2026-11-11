import { parseInput } from "@/lib/life-os/guide/catalog";
import { buildConsultation } from "@/lib/life-os/guide/export";
import { readGuideCatalog } from "@/lib/notion/repositories/guide";
export const runtime = "nodejs";
export const maxDuration = 60;
const json = (data: unknown, status = 200) => Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) return json({ error: "この画面からもう一度お試しください。" }, 403);
  if (!request.headers.get("content-type")?.startsWith("application/json")) return json({ error: "入力形式を確認してください。" }, 415);
  let input;
  try {
    const reader = request.body?.getReader();
    if (!reader) throw new Error("No input");
    const chunks: Uint8Array[] = []; let bytes = 0;
    while (true) { const {value, done} = await reader.read(); if (done) break; bytes += value.length; if (bytes > 6000) { await reader.cancel(); return json({error:"入力が長すぎます。"},413); } chunks.push(value); }
    input = parseInput(JSON.parse(Buffer.concat(chunks).toString("utf8")));
  } catch { return json({error:"相談は1〜600文字で入力し、条件を選び直してください。"},400); }
  try { return json(buildConsultation(await readGuideCatalog(), input)); }
  catch { return json({error:"候補を読み込めませんでした。入力内容はそのままで、少し待ってお試しください。"},503); }
}
