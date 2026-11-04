import "server-only";
import { del, put } from "@vercel/blob";
import { createQuestCoordinator } from "./coordinator";

// Shared across preview/production because both operate on the same Notion SSOT.
// Separate from the photo cleanup prefix; never automatically purge pending locks.
export const coordinateQuestOperation = createQuestCoordinator({
  async claim(key) {
    if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error("Quest operation coordination is not configured.");
    try {
      const result = await put(`life-os-quest-operations/${key}.json`, JSON.stringify({ startedAt: new Date().toISOString() }), {
        access: "private", addRandomSuffix: false, allowOverwrite: false, contentType: "application/json", cacheControlMaxAge: 60,
      });
      return result.etag;
    } catch { return null; }
  },
  async release(key, etag) { await del(`life-os-quest-operations/${key}.json`, { ifMatch: etag }); },
});
