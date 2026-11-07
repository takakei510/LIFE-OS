import { parseInput } from "@/lib/life-os/guide/catalog";
import { recommendAdventures } from "@/lib/life-os/guide/recommend";
export const runtime = "nodejs";
export const maxDuration = 60;
const cooldowns = new Map<string, number>();
const json = (data: unknown, status = 200) => Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) return json({ error: "この画面からもう一度お試しください。" }, 403);
  if (process.env.VERCEL_ENV !== "preview" || process.env.GUIDE_ENABLED !== "true" || process.env.GUIDE_FREE_CREDITS_VERIFIED !== "true") {
    return json({ error: "案内人は準備中です。AIの無料利用設定を確認してから開始します。" }, 503);
  }
  if (!request.headers.get("content-type")?.startsWith("application/json")) return json({ error: "入力形式を確認してください。" }, 415);
  let input;
  try {
    const reader = request.body?.getReader();
    if (!reader) throw new Error("相談を入力してください。");
    const chunks: Uint8Array[] = []; let bytes = 0;
    while (true) { const { value, done } = await reader.read(); if (done) break; bytes += value.length; if (bytes > 6000) { await reader.cancel(); return json({ error: "入力が長すぎます。" }, 413); } chunks.push(value); }
    input = parseInput(JSON.parse(Buffer.concat(chunks).toString("utf8")));
  } catch { return json({ error: "相談は1〜600文字で入力し、条件を選び直してください。" }, 400); }
  // Local cooldown supplements the platform's private deployment and Gateway spend cap.
  // It is intentionally not advertised as a distributed or financial limit.
  const identity = request.headers.get("x-vercel-id")?.split("::")[0] ?? "local";
  const now = Date.now();
  for (const [key, time] of cooldowns) if (time < now - 20000) cooldowns.delete(key);
  if ((cooldowns.get(identity) ?? 0) > now - 20000) return json({ error: "少し待ってから、もう一度相談してください。" }, 429);
  cooldowns.set(identity, now);
  try { return json(await recommendAdventures(input)); }
  catch { return json({ error: "今は候補を選べませんでした。無料枠や接続状況をご確認のうえ、少し待ってお試しください。相談内容は保存していません。" }, 503); }
}
