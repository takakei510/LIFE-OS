import { randomBytes, randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { generateClientTokenFromReadWriteToken } from "@vercel/blob/client";
import { MAX_PHOTO_COUNT, validatePhotoMetadata } from "@/lib/life-os/adventure-logs/photo-policy";
import { signPhotoGrant, verifyPhotoGrant, type PhotoGrant } from "@/lib/life-os/adventure-logs/photo-grants";
import { finalizeStagedPhoto, stagingPrefix } from "@/lib/life-os/adventure-logs/photo-storage";

export const runtime = "nodejs";
export const maxDuration = 60;
const COOKIE = "life-os-photo-owner";
const json = (body: object, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

async function readSmallJson(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Empty body");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > 16384) { await reader.cancel(); throw new Error("Body too large"); }
    chunks.push(value);
  }
  return JSON.parse(Buffer.concat(chunks).toString());
}

export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) return json({ ok: false, message: "許可されていない送信元です。" }, 403);
  // This single-player app is protected by Vercel Authentication. Fail closed until
  // an operator has checked deployment protection and enabled this environment.
  const secret = process.env.BLOB_READ_WRITE_TOKEN;
  if (process.env.PHOTO_UPLOADS_ENABLED !== "true" || !secret) return json({ ok: false, message: "写真の保存は準備中です。テキストだけでも記録できます。" }, 503);
  if (!request.headers.get("content-type")?.startsWith("application/json")) return json({ ok: false, message: "送信形式が正しくありません。" }, 415);

  let body;
  try { body = await readSmallJson(request); } catch { return json({ ok: false, message: "送信データを確認してください。" }, 400); }
  if (!body || typeof body !== "object") return json({ ok: false, message: "送信データを確認してください。" }, 400);
  const jar = await cookies();
  const owner = jar.get(COOKIE)?.value;

  if (body.operation === "prepare") {
    if (!/^[0-9a-f-]{36}$/i.test(body.requestId ?? "") || !Array.isArray(body.photos) || body.photos.length < 1 || body.photos.length > MAX_PHOTO_COUNT || !body.photos.every(validatePhotoMetadata)) return json({ ok: false, message: "写真はJPEG・PNG・WebP、1枚5MiB以下、最大5枚です。" }, 400);
    const session = owner && /^[0-9a-f]{64}$/.test(owner) ? owner : randomBytes(32).toString("hex");
    const batchId = randomUUID();
    const grant: PhotoGrant = {
      version: 1, batchId, owner: session, requestId: body.requestId,
      expiresAt: Date.now() + 45 * 60 * 1000,
      photos: body.photos.map((photo: { filename: string; contentType: string; size: number }, i: number) => ({
        ...photo, pathname: `${stagingPrefix()}${batchId}/${i}${photo.filename.slice(photo.filename.lastIndexOf(".")).toLowerCase()}`,
      })),
    };
    try {
      const uploads = await Promise.all(grant.photos.map(async (photo) => ({
        pathname: photo.pathname,
        token: await generateClientTokenFromReadWriteToken({
          token: secret, pathname: photo.pathname, allowedContentTypes: [photo.contentType],
          maximumSizeInBytes: photo.size, validUntil: Date.now() + 10 * 60 * 1000,
          addRandomSuffix: false, allowOverwrite: false,
        }),
      })));
      jar.set(COOKIE, session, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 86400 });
      return json({ ok: true, grant: signPhotoGrant(grant, secret), uploads });
    } catch { return json({ ok: false, message: "写真の送信準備ができませんでした。しばらくしてから試してください。" }, 503); }
  }

  if (body.operation === "finalize") {
    let grant: PhotoGrant;
    try {
      if (typeof body.grant !== "string" || !Number.isInteger(body.index)) throw new Error();
      grant = verifyPhotoGrant(body.grant, owner ?? "", secret);
      if (body.index < 0 || body.index >= grant.photos.length) throw new Error();
    } catch { return json({ ok: false, message: "写真の送信期限が切れたか、送信情報が無効です。写真を選び直してください。" }, 403); }
    try {
      const upload = await finalizeStagedPhoto(grant, body.index);
      return json({ ok: true, upload });
    } catch (error) {
      const pending = error instanceof Error && error.message === "TRANSFER_PENDING";
      return json({ ok: false, message: pending ? "写真の転送結果を確認中です。少し待って再試行してください。解消しない場合は写真を選び直してください。" : "写真を保存できませんでした。画像の形式・容量・通信状態を確認してください。" }, pending ? 409 : 422);
    }
  }
  return json({ ok: false, message: "送信データを確認してください。" }, 400);
}
