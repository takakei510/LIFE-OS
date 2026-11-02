import "server-only";
import { del, get, list, put } from "@vercel/blob";
import { validateImageContent } from "./image-content";
import { uploadPhotosToNotion } from "@/lib/notion/file-uploads";
import { validatePhotoUploads } from "./photo-upload-validation";
import { MAX_PHOTO_SIZE_BYTES } from "./photo-policy";
import type { PhotoGrant } from "./photo-grants";
import { transferPhotoOnce, type TransferState } from "./photo-transfer";

export const stagingPrefix = () => `life-os-photos/${process.env.VERCEL_ENV ?? "development"}/`;

export async function readTransferState(path: string): Promise<TransferState | null> {
  const stored = await get(path, { access: "private", useCache: false });
  if (!stored || stored.statusCode !== 200) return null;
  return JSON.parse(await new Response(stored.stream).text()) as TransferState;
}

export async function finalizeStagedPhoto(grant: PhotoGrant, index: number) {
  const photo = grant.photos[index];
  if (!photo.pathname.startsWith(`${stagingPrefix()}${grant.batchId}/`)) throw new Error("INVALID_PHOTO");
  const statePath = `${stagingPrefix()}${grant.batchId}/result-${index}.json`;
  const cleanup = () => del(photo.pathname);
  return transferPhotoOnce({
    read: () => readTransferState(statePath),
    claim: async () => {
      try {
        const claim = await put(statePath, JSON.stringify({ status: "pending" }), {
          access: "private", addRandomSuffix: false, allowOverwrite: false,
          contentType: "application/json", cacheControlMaxAge: 60,
        });
        return claim.etag;
      } catch {
        // Conflict or unavailable store: never risk a second transfer.
        return null;
      }
    },
    upload: async () => {
      const staged = await get(photo.pathname, { access: "private", useCache: false });
      if (!staged || staged.statusCode !== 200 || staged.blob.size !== photo.size || staged.blob.size > MAX_PHOTO_SIZE_BYTES || staged.blob.contentType !== photo.contentType) throw new Error("INVALID_PHOTO");
      const bytes = await new Response(staged.stream).arrayBuffer();
      if (bytes.byteLength !== photo.size) throw new Error("INVALID_PHOTO");
      const file = new File([bytes], photo.filename, { type: photo.contentType });
      const validation = await validatePhotoUploads([file]);
      if (!validation.ok) throw new Error("INVALID_PHOTO");
      // Decode for validation only; upload the untouched original bytes.
      await validateImageContent(bytes, photo.contentType);
      return (await uploadPhotosToNotion(validation.photos))[0];
    },
    releaseInvalid: (etag) => del(statePath, { ifMatch: etag }),
    complete: async (etag, result) => {
      await put(statePath, JSON.stringify({ status: "complete", result }), {
        access: "private", addRandomSuffix: false, allowOverwrite: true, ifMatch: etag,
        contentType: "application/json", cacheControlMaxAge: 60,
      });
    },
    cleanup,
  });
}

export async function cleanupStagedPhotos(cursor?: string) {
  // Vercel runs scheduled jobs only in production. Its job must also collect
  // abandoned review uploads in this dedicated staging store.
  const prefix = process.env.VERCEL_ENV === "production" ? "life-os-photos/" : stagingPrefix();
  const before = Date.now() - 24 * 60 * 60 * 1000;
  let deleted = 0;
  const resumePath = `life-os-photo-cleanup/${process.env.VERCEL_ENV ?? "development"}.json`;
  if (!cursor) {
    const resume = await get(resumePath, { access: "private", useCache: false });
    if (resume?.statusCode === 200) cursor = (await new Response(resume.stream).json()).cursor;
  }
  const deadline = Date.now() + 40_000;
  let hasMore = true;
  while (hasMore && Date.now() < deadline) {
    const page = await list({ prefix, limit: 100, cursor });
    const expired = page.blobs.filter((blob) => blob.uploadedAt.getTime() < before);
    if (expired.length) {
      await del(expired.map((blob) => blob.url));
      deleted += expired.length;
    }
    hasMore = page.hasMore;
    cursor = page.cursor;
  }
  await put(resumePath, JSON.stringify({ cursor: hasMore ? cursor : undefined }), {
    access: "private", addRandomSuffix: false, allowOverwrite: true, contentType: "application/json", cacheControlMaxAge: 60,
  });
  return { deleted, hasMore };
}
