import "server-only";
import { cookies } from "next/headers";
import { get, put } from "@vercel/blob";
import { verifyPhotoGrant } from "./photo-grants";
import { readTransferState, stagingPrefix } from "./photo-storage";
import type { TransferResult } from "./photo-transfer";

export async function resolvePhotoAttachments(token: string, requestId: string): Promise<TransferResult[]> {
  const secret = process.env.BLOB_READ_WRITE_TOKEN;
  if (!secret || process.env.PHOTO_UPLOADS_ENABLED !== "true") throw new Error("Photos unavailable");
  const owner = (await cookies()).get("life-os-photo-owner")?.value ?? "";
  const grant = verifyPhotoGrant(token, owner, secret);
  if (grant.requestId !== requestId) throw new Error("Wrong log");
  const results: TransferResult[] = [];
  for (let index = 0; index < grant.photos.length; index++) {
    const photo = grant.photos[index];
    if (!photo.pathname.startsWith(`${stagingPrefix()}${grant.batchId}/`)) throw new Error("Wrong environment");
    const state = await readTransferState(`${stagingPrefix()}${grant.batchId}/result-${index}.json`);
    if (state?.status !== "complete") throw new Error("Photos not ready");
    results.push(state.result);
  }
  return results;
}

// Claims are temporary request coordination; Notion Request ID remains the
// authoritative record lookup. A lost create response must not trigger a resend.
export async function claimLogCreation(requestId: string): Promise<void> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return;
  if (!/^[0-9a-f-]{36}$/i.test(requestId)) throw new Error("Invalid request ID");
  await put(`${stagingPrefix()}log-${requestId}.json`, "{}", {
    access: "private", addRandomSuffix: false, allowOverwrite: false, contentType: "application/json", cacheControlMaxAge: 60,
  });
}

export async function attachPhotosOnce(requestId: string, pageId: string, photos: TransferResult[], attach: () => Promise<void>) {
  const path = `${stagingPrefix()}attach-${requestId}.json`;
  const existing = await get(path, { access: "private", useCache: false });
  if (existing?.statusCode === 200) {
    const state = await new Response(existing.stream).json();
    if (state.pageId !== pageId || JSON.stringify(state.ids) !== JSON.stringify(photos.map((p) => p.id))) throw new Error("Different attachment request");
    if (state.status === "complete") return;
    // Updating Media with the same ordered file_upload IDs is idempotent. The
    // repository additionally checks the current Media before replacing it.
  }
  const state = { pageId, ids: photos.map((p) => p.id), status: "pending" };
  let etag: string;
  if (existing?.statusCode === 200) {
    etag = existing.blob.etag;
  } else {
    const created = await put(path, JSON.stringify(state), { access: "private", addRandomSuffix: false, allowOverwrite: false, contentType: "application/json", cacheControlMaxAge: 60 });
    etag = created.etag;
  }
  await attach();
  await put(path, JSON.stringify({ ...state, status: "complete" }), { access: "private", addRandomSuffix: false, allowOverwrite: true, ifMatch: etag, contentType: "application/json", cacheControlMaxAge: 60 });
}
