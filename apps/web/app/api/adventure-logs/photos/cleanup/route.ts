import { timingSafeEqual } from "node:crypto";
import { cleanupStagedPhotos } from "@/lib/life-os/adventure-logs/photo-storage";

export const runtime = "nodejs";
export const maxDuration = 60;
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const supplied = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  if (!secret || Buffer.byteLength(supplied) !== Buffer.byteLength(expected) || !timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))) return new Response("Unauthorized", { status: 401 });
  const cursor = new URL(request.url).searchParams.get("cursor") ?? undefined;
  const result = await cleanupStagedPhotos(cursor);
  return Response.json(result, { headers: { "Cache-Control": "no-store" } });
}
